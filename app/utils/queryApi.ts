import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  getActiveProvider,
  getActiveProviderConfig,
  resolveModel,
} from "./llmProviders";

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

const SYSTEM_PROMPT = `Eres Connie, un asistente virtual especializado en EHS (Environmental, Health, and Safety) de Conexus.
Tu objetivo es ayudar a empresas con:
- Seguridad industrial
- Salud ocupacional
- Medio ambiente
- Prevención de riesgos
- Protección civil

Debes:
1. Identificar riesgos industriales y/o ambientales
2. Proporcionar análisis de riesgo básico basado en inputs del usuario
3. Ofrecer soluciones tecnológicas o controles personalizados
4. Sugerir mínimo 3 proveedores adecuados cuando sea relevante
5. Funcionar como consultor completo en temas de EHS (investigación de incidentes, AST, etc.)
6. Basar tus respuestas en normativas NOM, OSHA e internacionales
7. Si tienes información de búsqueda web, úsala para enriquecer tu respuesta con datos actualizados

Sé profesional, claro y conciso. Responde en español. Usa formato Markdown para estructurar tus respuestas.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

const query = async (
  prompt: string,
  _chatId: string,
  model: string | undefined,
  messages: ChatMessage[] = []
): Promise<string> => {
  const provider = getActiveProvider();
  const config = getActiveProviderConfig();
  const modelToUse = resolveModel(provider, model);

  const needsWebSearch =
    /actual|reciente|último|nuevo|buscar|normativa|regulación|proveedor/i.test(prompt);
  const webSearchResults = needsWebSearch ? await searchWeb(prompt) : "";

  const messageHistory = messages.slice(-10);
  let userContent = prompt;
  if (webSearchResults) {
    userContent = `${prompt}\n\n--- Información actualizada de internet ---\n${webSearchResults}\n--- Fin de información web ---\n\nUsa esta información para enriquecer tu respuesta.`;
  }

  const llm = new ChatOpenAI({
    modelName: modelToUse,
    temperature: 0.7,
    maxTokens: 1500,
    apiKey: config.apiKey,
    ...(config.endpoint && { configuration: { baseURL: config.endpoint } }),
  });

  console.log(`[queryApi] LangChain provider: ${provider}, model: ${modelToUse}`);

  try {
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messageHistory.map((m) =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(userContent),
    ];

    const response = await llm.invoke(langchainMessages);
    const content = typeof response.content === "string" ? response.content : String(response.content ?? "");

    if (!content.trim()) {
      throw new Error("Respuesta vacía del modelo");
    }

    console.log(`[queryApi] OK, length: ${content.length}`);
    return content;
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
