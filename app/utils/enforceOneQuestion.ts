/**
 * One-question policy: when state is not CLOSE, trim assistant response to at most 1 question.
 * Prefer the question that matches key topics (industria, tarea, exposición, consecuencia, controles).
 */

import type { ConversationState } from "./stateDerivation";

const QUESTION_PRIORITY_KEYWORDS = [
  "industria|sector",
  "tarea|proceso|actividad",
  "exposición|personas expuestas|frecuencia",
  "consecuencia|severidad|impacto",
  "controles|EPP|procedimiento",
];

/** Preguntas que no deben usarse como cierre: contratar consultor externo (Connie es el consultor). */
const FORBIDDEN_QUESTION_PATTERN =
  /contrat(a|ar|ación)|consultor\s+(en\s+)?seguridad|consultor\s+de\s+riesgos|considerar\s+(la\s+)?contratación/i;

function extractQuestions(text: string): { question: string; index: number; priority: number }[] {
  const questions: { question: string; index: number; priority: number }[] = [];
  const re = /[^\n.?]*\?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (!trimmed) continue;
    if (FORBIDDEN_QUESTION_PATTERN.test(trimmed)) continue; // excluir "¿Estás dispuesto a contratar un consultor...?"
    let priority = 0;
    const lower = trimmed.toLowerCase();
    for (let i = 0; i < QUESTION_PRIORITY_KEYWORDS.length; i++) {
      if (new RegExp(QUESTION_PRIORITY_KEYWORDS[i], "i").test(lower)) {
        priority = QUESTION_PRIORITY_KEYWORDS.length - i;
        break;
      }
    }
    questions.push({ question: trimmed, index: match.index, priority });
  }
  return questions;
}

/**
 * If there is more than one question and state !== CLOSE, reduce to one question block.
 * Keeps the rest as "Supuestos / primer borrador" and the chosen question at the end.
 */
const FALLBACK_NEXT_STEP =
  "**Para avanzar:** ¿Quieres que detalle los controles, que sugiera criterios para cotizar con proveedores, o que pasemos a otra tarea o riesgo?";

export function enforceOneQuestion(
  assistantResponse: string,
  state: ConversationState
): string {
  if (state === "CLOSE") return assistantResponse;

  const questions = extractQuestions(assistantResponse);
  if (questions.length === 0) {
    // Si la única pregunta era del tipo "contratar consultor", sustituir por siguiente paso útil
    const lines = assistantResponse.trim().split("\n");
    const lastLineWithQuestion = lines.filter((l) => l.includes("?")).pop();
    if (lastLineWithQuestion && FORBIDDEN_QUESTION_PATTERN.test(lastLineWithQuestion)) {
      const idx = assistantResponse.lastIndexOf(lastLineWithQuestion);
      return (
        assistantResponse.slice(0, idx).trim() + "\n\n" + FALLBACK_NEXT_STEP
      );
    }
    return assistantResponse;
  }
  if (questions.length <= 1) return assistantResponse;

  const chosen = questions.sort((a, b) => b.priority - a.priority)[0] ?? questions[questions.length - 1];
  const beforeQuestion = assistantResponse.slice(0, chosen.index).trim();
  const afterQuestion = assistantResponse.slice(chosen.index + chosen.question.length).trim();

  const intro = "**Para avanzar con un análisis consistente, por ahora responde solo esta pregunta:**\n\n";
  const outro = afterQuestion
    ? "\n\n--- *Supuestos y primer borrador (para afinar después):* ---\n" + afterQuestion
    : "";

  return beforeQuestion + "\n\n" + intro + chosen.question + outro;
}

/**
 * Mantiene solo una pregunta (la última por defecto) y convierte el resto en afirmaciones.
 * Para usar en modo exploración/pre-análisis (readiness LOW o MEDIUM).
 */
export function enforceSingleQuestion(response: string): string {
  const questions = extractQuestions(response);
  if (questions.length === 0) {
    const lines = response.trim().split("\n");
    const lastWithQ = lines.filter((l) => l.includes("?")).pop();
    if (lastWithQ && FORBIDDEN_QUESTION_PATTERN.test(lastWithQ)) {
      const idx = response.lastIndexOf(lastWithQ);
      return response.slice(0, idx).trim() + "\n\n" + FALLBACK_NEXT_STEP;
    }
    return response;
  }
  if (questions.length <= 1) return response;
  let chosen = questions[questions.length - 1];
  if (FORBIDDEN_QUESTION_PATTERN.test(chosen.question)) {
    const other = questions.find((q) => !FORBIDDEN_QUESTION_PATTERN.test(q.question));
    chosen = other ?? chosen;
    if (FORBIDDEN_QUESTION_PATTERN.test(chosen.question)) {
      const beforeQuestion = response.slice(0, chosen.index).trim();
      return beforeQuestion + "\n\n" + FALLBACK_NEXT_STEP;
    }
  }
  const beforeQuestion = response.slice(0, chosen.index).trim();
  const afterQuestion = response.slice(chosen.index + chosen.question.length).trim();
  const intro = "**Para avanzar, responde solo esta pregunta:**\n\n";
  const rest = beforeQuestion + (afterQuestion ? "\n\n--- *Contexto adicional:* ---\n" + afterQuestion : "");
  return rest ? rest + "\n\n" + intro + chosen.question : intro + chosen.question;
}
