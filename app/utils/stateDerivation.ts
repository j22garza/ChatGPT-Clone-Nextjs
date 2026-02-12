/**
 * Light state machine for EHS conversation flow.
 * State is derived from last N messages when no server-side persistence.
 */

export type ConversationState =
  | "TRIAGE"
  | "CONTEXT"
  | "HAZARD_ID"
  | "RISK_SCORING"
  | "CONTROLS"
  | "SOLUTIONS"
  | "PROVIDERS"
  | "CLOSE";

export const STATE_ORDER: ConversationState[] = [
  "TRIAGE",
  "CONTEXT",
  "HAZARD_ID",
  "RISK_SCORING",
  "CONTROLS",
  "SOLUTIONS",
  "PROVIDERS",
  "CLOSE",
];

export function getStateStep(state: ConversationState): number {
  const i = STATE_ORDER.indexOf(state);
  return i >= 0 ? i + 1 : 1;
}

const INDUSTRY_MARKS = /\b(industria|sector|rama|manufactura|construcción|químico|minería|automotriz|alimenticio|textil|servicios)\b/i;
const LOCATION_MARKS = /\b(ubicación|ciudad|estado|país|planta|sede|cdmx|monterrey|guadalajara)\b/i;
const EXPOSED_MARKS = /\b(empleados?|trabajadores?|personas?\s*expuestas?|cuántos|cuántas|#\s*personas)\b/i;
const TASK_MARKS = /\b(proceso|tarea|actividad|operación|mantenimiento|limpieza|arranque|etapa)\b/i;
const FREQUENCY_MARKS = /\b(frecuencia|diario|turno|horas?|continuo|ocasional|semanal)\b/i;
const HAZARD_MARKS = /\b(peligro|riesgo|identific|qué\s*riesgos|cuáles\s*riesgos|atrapamiento|caída|eléctri|químico|incendio|ergonomía)\b/i;
const PEC_MARKS = /\b(P\s*[=:]?\s*\d|E\s*[=:]?\s*\d|C\s*[=:]?\s*\d|probabilidad|exposición|consecuencia|P×E×C|score|puntaje)\b/i;
const CONTROLS_MARKS = /\b(controles?|EPP|respirador|guantes|casco|ventilación|procedimiento|LOTO|AST|capacitación|jerarquía)\b/i;
const SOLUTIONS_MARKS = /\b(solución|recomendación|implementar|tecnología|servicio|equipo\s*nuevo)\b/i;
const PROVIDERS_MARKS = /\b(proveedor|distribuidor|fabricante|quién\s*vende|dónde\s*comprar|certificación)\b/i;
const CLOSE_MARKS = /\b(próximo\s*paso|resumen\s*final|conclusión|gracias|suficiente|cerrar)\b/i;

export interface DerivedStateResult {
  state: ConversationState;
  stepIndex: number; // 1-based for UI "Paso N/8"
  hasIndustry: boolean;
  hasLocation: boolean;
  hasExposed: boolean;
  hasTask: boolean;
  hasHazard: boolean;
  hasPEC: boolean;
  hasControls: boolean;
}

/**
 * Derives conversation state from last N messages using heuristics.
 * No persistent state: we infer from content.
 */
export function deriveStateFromHistory(
  messages: { role: string; content: string }[],
  maxMessages = 10
): DerivedStateResult {
  const recent = messages.slice(-maxMessages);
  const fullText = recent.map((m) => m.content).join("\n").toLowerCase();

  const hasIndustry = INDUSTRY_MARKS.test(fullText);
  const hasLocation = LOCATION_MARKS.test(fullText);
  const hasExposed = EXPOSED_MARKS.test(fullText);
  const hasTask = TASK_MARKS.test(fullText);
  const hasHazard = HAZARD_MARKS.test(fullText);
  const hasPEC = PEC_MARKS.test(fullText);
  const hasControls = CONTROLS_MARKS.test(fullText);
  const hasSolutions = SOLUTIONS_MARKS.test(fullText);
  const hasProviders = PROVIDERS_MARKS.test(fullText);
  const hasClose = CLOSE_MARKS.test(fullText);

  // Last assistant message often indicates where we left off
  const lastAssistant = [...recent].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = (lastAssistant?.content ?? "").toLowerCase();

  let state: ConversationState = "TRIAGE";

  if (hasClose && (lastAssistantText.includes("próximo paso") || lastAssistantText.includes("resumen"))) {
    state = "CLOSE";
  } else if (hasProviders || lastAssistantText.includes("proveedor")) {
    state = "PROVIDERS";
  } else if (hasSolutions || (hasControls && lastAssistantText.includes("solución"))) {
    state = "SOLUTIONS";
  } else if (hasControls) {
    state = "CONTROLS";
  } else if (hasPEC || (hasHazard && /score|puntaje|nivel|tabla\s*de\s*riesgos/i.test(fullText))) {
    state = "RISK_SCORING";
  } else if (hasHazard) {
    state = "HAZARD_ID";
  } else if (hasIndustry || hasLocation || hasExposed || hasTask) {
    state = "CONTEXT";
  } else {
    state = "TRIAGE";
  }

  return {
    state,
    stepIndex: getStateStep(state),
    hasIndustry,
    hasLocation,
    hasExposed,
    hasTask,
    hasHazard,
    hasPEC,
    hasControls,
  };
}
