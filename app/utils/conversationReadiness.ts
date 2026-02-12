/**
 * Evalúa si hay suficientes datos en la conversación para permitir análisis/tablas.
 * Doble modo: EXPLORACIÓN (LOW/MEDIUM) vs ANÁLISIS (HIGH).
 */

export type ReadinessLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ConversationReadiness {
  hasIndustry: boolean;
  hasSpecificTask: boolean;
  hasExposureInfo: boolean;
  hasConsequenceInfo: boolean;
  readinessLevel: ReadinessLevel;
}

const INDUSTRY_MARKS =
  /\b(industria|sector|rama|manufactura|construcción|construccion|químico|quimico|minería|mineria|automotriz|alimenticio|textil|servicios|planta|empresa)\b/i;
const TASK_MARKS =
  /\b(proceso|tarea|actividad|operación|operacion|mantenimiento|limpieza|arranque|etapa|soldadura|altura|alturas|izaje|excavación|excavacion|cnc|torno|riesgo\s*de\s+caída|espacio\s*confinado)\b/i;
const EXPOSURE_MARKS =
  /\b(frecuencia|diario|diaria|turno|horas?|continuo|ocasional|semanal|mensual|trabajadores?|empleados?|personas?\s*expuestas?|cuántos|cuantas?\s*personas|(\d+)\s*(empleados?|trabajadores?|personas?))\b/i;
const CONSEQUENCE_MARKS =
  /\b(consecuencia|severidad|impacto|lesión|lesion|enfermedad|daño|dano|P\s*[=:]?\s*\d|E\s*[=:]?\s*\d|C\s*[=:]?\s*\d|probabilidad|exposición|P×E×C|score|puntaje)\b/i;

/**
 * Evalúa último mensaje + historial reciente y devuelve nivel de preparación.
 * - LOW: solo industria (o nada) → modo exploración, 1 pregunta, sin tablas ni scoring.
 * - MEDIUM: industria + tarea pero sin frecuencia/exposición → pre-análisis, hipótesis, 1 pregunta, sin score.
 * - HIGH: tarea + frecuencia/exposición + (consecuencia o suficiente contexto) → análisis completo con tabla y scoring.
 */
export function getConversationReadiness(
  recentMessages: { role: string; content: string }[],
  currentPrompt: string,
  maxMessages = 10
): ConversationReadiness {
  const combined = recentMessages
    .map((m) => m.content)
    .concat(currentPrompt)
    .join("\n");
  const text = combined.toLowerCase();

  const hasIndustry = INDUSTRY_MARKS.test(text);
  const hasSpecificTask = TASK_MARKS.test(text);
  const hasExposureInfo = EXPOSURE_MARKS.test(text);
  const hasConsequenceInfo = CONSEQUENCE_MARKS.test(text);

  let readinessLevel: ReadinessLevel = "LOW";

  if (hasSpecificTask && hasExposureInfo) {
    readinessLevel = "HIGH";
  } else if (hasSpecificTask && !hasExposureInfo) {
    readinessLevel = "MEDIUM";
  } else if (hasIndustry || hasSpecificTask) {
    readinessLevel = "LOW";
  }

  return {
    hasIndustry,
    hasSpecificTask,
    hasExposureInfo,
    hasConsequenceInfo,
    readinessLevel,
  };
}
