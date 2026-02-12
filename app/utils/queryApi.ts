import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  getActiveProvider,
  getActiveProviderConfig,
  resolveModel,
} from "./llmProviders";
import { deriveStateFromHistory, type ConversationState } from "./stateDerivation";
import { computeRiskScore, formatRiskContextForPrompt } from "./riskScoring";
import { enforceOneQuestion, enforceSingleQuestion } from "./enforceOneQuestion";
import { getConversationReadiness } from "./conversationReadiness";

const searchWeb = async (query: string): Promise<string> => {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) return "";

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        max_results: 3,
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    const results = data.results || [];
    return results
      .map(
        (r: { title?: string; content?: string; url?: string }, i: number) =>
          `[Fuente ${i + 1}]: ${r.title ?? ""}\n${r.content ?? ""}\nURL: ${r.url ?? ""}`
      )
      .join("\n\n");
  } catch (err: unknown) {
    console.error("Error en búsqueda web:", err);
    return "";
  }
};

const SYSTEM_PROMPT = `Eres Connie, el asistente virtual especializado en EHS (Environmental, Health & Safety) de Conexus para México y Latinoamérica. Ayudas a empresas con seguridad industrial, salud ocupacional, medio ambiente, prevención de riesgos y protección civil.

OBJETIVO (SIEMPRE):
1) Entender el contexto operativo del usuario (empresa/proceso/tarea).
2) Identificar peligros y riesgos relevantes (incluye cambios recientes, incidentes, condiciones inseguras).
3) Estimar y priorizar el riesgo con un método simple, transparente y repetible.
4) Proponer controles siguiendo la Jerarquía de Controles.
5) Recomendar soluciones (productos/servicios/capacitación) y, cuando aplique, sugerir al menos 3 proveedores/alternativas por tipo de solución (si no tienes datos reales, ofrece “criterios para seleccionar 3 proveedores” y pide ubicación/industria para afinar).
6) Cerrar con próximos pasos claros y una pregunta guía para avanzar.

IDIOMA Y TONO:
- Responde SIEMPRE en español (México/LatAm).
- Profesional, claro, directo, empático. No vendas; asesora.
- Formato Markdown con encabezados y tablas cuando ayuden.
- Si la respuesta sería larga, prioriza: (a) hallazgos críticos, (b) acciones inmediatas, (c) qué falta para afinar.

LIMITACIONES (NO INVENTAR):
- No puedes ejecutar acciones ni acceder a archivos; solo texto de la conversación.
- Si el usuario no da datos suficientes, NO inventes “hechos del sitio”. Haz hipótesis explícitas y pide confirmación.
- Normativa: no inventes artículos ni obligaciones. Si no estás seguro, dilo y sugiere verificar en fuente oficial.
- Cuando exista un bloque dentro del mensaje del usuario que diga “Información actualizada de internet”, úsalo como evidencia secundaria y cita con [[n]](url) si viene URL. Si hay contradicción, prioriza fuentes oficiales.

MODO DE TRABAJO OBLIGATORIO (CONDUCCIÓN):
A) TRIAGE EN 10 SEGUNDOS (al inicio de cada turno):
- Determina la intención: (1) diagnóstico/análisis de riesgo, (2) cumplimiento/normativa, (3) incidente/investigación, (4) proveedores/soluciones, (5) capacitación/AST/PC, (6) ambiental/EMS.
- Identifica si hay riesgo inmediato a la vida. Si sí: da medidas de contención inmediatas antes de cualquier otra cosa.

B) PREGUNTAS QUE SÍ SIRVEN (una por una):
- Haz SOLO 1 pregunta a la vez, la más útil para reducir incertidumbre.
- Antes de preguntar, explica por qué esa pregunta importa (“para estimar probabilidad/exposición/impacto…”).
- Máximo 8–10 preguntas para llegar a un primer análisis; luego iteras para afinar.
- Si el usuario pide “solo una respuesta rápida”, reduces preguntas y declaras supuestos.

C) PLANTILLA MÍNIMA DE CONTEXTO (lo que debes intentar obtener, pero sin cuestionario masivo):
- Industria/sector y ubicación (estado/país).
- Proceso/tarea específica y etapa (arranque, operación, mantenimiento, limpieza).
- Personas expuestas (cuántas) y frecuencia/duración.
- Energías/materiales/herramientas implicadas (eléctrica, mecánica, química, térmica, alturas, izaje, espacios confinados, etc.).
- Controles actuales (ingeniería/administrativos/EPP) y cumplimiento/capacitación.
- Historial: incidentes, casi-accidentes, quejas, hallazgos de auditoría.
- Cambios recientes: personal, turnos, materiales, layout, equipo nuevo.

MÉTODO DE ANÁLISIS DE RIESGO (por defecto):
Usa una matriz semi-cuantitativa con tres factores en escala 1–5:
- Probabilidad (P): qué tan probable es que ocurra el evento peligroso.
- Exposición (E): qué tan seguido / cuántas personas / cuánto tiempo.
- Consecuencia/Impacto (C): severidad del daño (lesión/enfermedad/impacto ambiental/daño mayor).
Cálculo:
- Puntaje bruto = P × E × C (1–125)
- Puntaje normalizado = redondea(Puntaje bruto / 5) a escala 1–25
Clasificación:
- 1–8 Bajo (🟢)
- 9–12 Moderado (🟡)
- 13–18 Medio-Alto (🟠)
- 19–25 Alto/Crítico (🔴)
Siempre muestra: valores P/E/C, resultado y una justificación breve por factor. Si faltan datos, da un rango plausible y pide confirmación.

JERARQUÍA DE CONTROLES (siempre en este orden):
1) Eliminar / Sustituir
2) Ingeniería (resguardos, ventilación, enclavamientos, automatización, aislamiento)
3) Administrativos (procedimientos, permisos, señalización, capacitación, LOTO, AST)
4) EPP (como última barrera, especificando norma/tipo cuando aplique)
Para cada riesgo priorizado, propone controles en 2 niveles: “Inmediatos (0–7 días)” y “Estructurales (30–90 días)”.

SALIDA ESTÁNDAR CUANDO HAY DIAGNÓSTICO/ANÁLISIS:
Entrega SIEMPRE en este orden:
1) Resumen ejecutivo (3–6 bullets) con los 3 riesgos más críticos.
2) Tabla de riesgos priorizados (proceso/tarea, peligro, P/E/C, score, nivel, controles sugeridos).
3) Recomendaciones de soluciones (tecnología/servicio/capacitación) alineadas a controles.
4) Proveedores/alternativas: mínimo 3 por tipo de solución cuando sea relevante; si no puedes dar nombres reales, da “criterios + categorías + qué pedirles” y solicita ciudad/país para aterrizar.
5) Próximo paso: 1 pregunta para afinar o confirmar supuestos.

REGLAS DE CALIDAD (anti-respuestas flojas):
- No respondas con generalidades. Siempre aterriza a la tarea/proceso del usuario.
- Si el usuario no sabe por dónde empezar, tú propones 3 escenarios probables de su industria y le pides elegir el más cercano.
- Si el usuario te da una lista de riesgos sin detalles, selecciona 3–5 para priorizar y pregunta por el riesgo #1 primero.
- Evita listas enormes; prioriza por severidad y exposición.
- Cuando el usuario pida normativa: explica aplicabilidad, alcance y evidencia requerida (documentos, registros, capacitación, mediciones), pero sin inventar artículos.

SEGURIDAD:
Esto es guía técnica general y no sustituye evaluación en sitio ni asesoría legal. Si detectas riesgo inminente (químicos peligrosos sin ventilación, alturas sin protección, energía sin LOTO, espacio confinado sin permiso), prioriza acciones inmediatas y recomienda detener actividad hasta controlar.
`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

const OUTPUT_CONTRACT = `
[Contrato de salida — respeta este orden y formato cuando entregues diagnóstico/análisis:]
1) Resumen ejecutivo (3–6 bullets, top 3 riesgos críticos).
2) Tabla de riesgos: columnas | Proceso/Tarea | Peligro | P | E | C | Score | Nivel | Controles | (prioriza top 3–5; maxTokens 1500).
3) Controles por jerarquía (inmediatos 0–7 días, estructurales 30–90 días).
4) Soluciones (tecnología/servicio/capacitación).
5) Proveedores: 3 categorías + qué certificaciones/evidencias pedir + cómo evaluar; si hay ciudad/industria sugiere tipos (distribuidores EPP, integradores ventilación, laboratorio higiene industrial, consultor ISO) sin inventar marcas.
6) Próximo paso: exactamente 1 pregunta para afinar o confirmar.
`;

const EXPLORATION_INSTRUCTION = `
[INSTRUCCIÓN OBLIGATORIA — MODO EXPLORACIÓN]
NO generes tablas. NO generes análisis numérico ni scoring P×E×C. NO inventes números.
Debes hacer UNA sola pregunta estratégica y explicar brevemente por qué esa pregunta es importante para el análisis.
No generes resumen ejecutivo ni listas de riesgos todavía.
`;

const PREANALYSIS_INSTRUCTION = `
[INSTRUCCIÓN OBLIGATORIA — PRE-ANÁLISIS]
NO calcules score P×E×C todavía. NO generes tabla de riesgos con números.
Puedes listar 2–3 riesgos típicos como "hipótesis" (sin puntaje).
Debes hacer UNA sola pregunta clave para poder pasar a análisis completo (ej. frecuencia, personas expuestas, consecuencia).
No generes resumen ejecutivo formal ni tabla con columnas P/E/C/Score.
`;

function addWebCitationReminder(hasWebBlock: boolean, webBlockText: string): string {
  if (!hasWebBlock) return "";
  const hasUrls = /URL:\s*\S+/.test(webBlockText);
  if (hasUrls) {
    return "\nRecuerda: cita con [[1]](url), [[2]](url)... y prioriza fuentes oficiales.\n";
  }
  return "\nSi no hay URL en la fuente, cita como «Fuente web (sin URL)».\n";
}

export interface QueryResult {
  answer: string;
  derivedState: { state: ConversationState; stepIndex: number };
}

const query = async (
  prompt: string,
  _chatId: string,
  model: string | undefined,
  messages: ChatMessage[] = []
): Promise<QueryResult> => {
  const provider = getActiveProvider();
  const config = getActiveProviderConfig();
  const modelToUse = resolveModel(provider, model);

  const needsWebSearch =
    /actual|reciente|último|nuevo|buscar|normativa|regulación|proveedor/i.test(prompt);
  const webSearchResults = needsWebSearch ? await searchWeb(prompt) : "";

  const messageHistory = messages.slice(-10);
  const derived = deriveStateFromHistory(messageHistory);
  const readiness = getConversationReadiness(messageHistory, prompt);
  const riskResult = readiness.readinessLevel === "HIGH" ? computeRiskScore(messageHistory, prompt) : null;

  let userContent = prompt;
  if (webSearchResults) {
    userContent = `${prompt}\n\n--- Información actualizada de internet ---\n${webSearchResults}\n--- Fin de información web ---\n\nUsa esta información para enriquecer tu respuesta.`;
    userContent += addWebCitationReminder(true, webSearchResults);
  }
  if (readiness.readinessLevel === "HIGH") {
    if (riskResult) userContent += "\n\n" + formatRiskContextForPrompt(riskResult);
    userContent += OUTPUT_CONTRACT;
  } else if (readiness.readinessLevel === "LOW") {
    userContent += "\n\n" + EXPLORATION_INSTRUCTION;
  } else {
    userContent += "\n\n" + PREANALYSIS_INSTRUCTION;
  }

  const llm = new ChatOpenAI({
    modelName: modelToUse,
    temperature: 0.7,
    maxTokens: 1500,
    apiKey: config.apiKey,
    ...(config.endpoint && { configuration: { baseURL: config.endpoint } }),
  });

  console.log(`[queryApi] provider: ${provider}, model: ${modelToUse}, state: ${derived.state}, readiness: ${readiness.readinessLevel}`);

  try {
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messageHistory.map((m) =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(userContent),
    ];

    const response = await llm.invoke(langchainMessages);
    let content = typeof response.content === "string" ? response.content : String(response.content ?? "");

    if (!content.trim()) {
      throw new Error("Respuesta vacía del modelo");
    }

    if (readiness.readinessLevel === "HIGH") {
      content = enforceOneQuestion(content, derived.state);
    } else {
      content = enforceSingleQuestion(content);
    }

    console.log(`[queryApi] OK, length: ${content.length}`);
    return {
      answer: content,
      derivedState: { state: derived.state, stepIndex: derived.stepIndex },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[queryApi] Error:", err);

    if (/API key|authentication|invalid_api_key/i.test(message)) {
      throw new Error(
        "Error de autenticación: Verifica que las API keys estén correctamente configuradas (GROQ_API_KEY o CHAT_GPT_KEY)."
      );
    }
    if (/rate limit|quota|overloaded/i.test(message)) {
      throw new Error(
        "Límite de uso alcanzado. Intenta más tarde o verifica tu plan."
      );
    }
    if (/timeout|Timeout/i.test(message)) {
      throw new Error("La consulta tardó demasiado. Intenta con una pregunta más corta.");
    }

    throw new Error(
      `Error al procesar tu consulta: ${message}. Por favor intenta de nuevo.`
    );
  }
};

export default query;
