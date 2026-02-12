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

function extractQuestions(text: string): { question: string; index: number; priority: number }[] {
  const questions: { question: string; index: number; priority: number }[] = [];
  // Match sentence-like segments ending in ?
  const re = /[^\n.?]*\?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (!trimmed) continue;
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
export function enforceOneQuestion(
  assistantResponse: string,
  state: ConversationState
): string {
  if (state === "CLOSE") return assistantResponse;

  const questions = extractQuestions(assistantResponse);
  if (questions.length <= 1) return assistantResponse;

  // Choose: highest priority, or last one
  const chosen = questions.sort((a, b) => b.priority - a.priority)[0] ?? questions[questions.length - 1];
  const beforeQuestion = assistantResponse.slice(0, chosen.index).trim();
  const afterQuestion = assistantResponse.slice(chosen.index + chosen.question.length).trim();

  const intro = "**Para avanzar con un análisis consistente, por ahora responde solo esta pregunta:**\n\n";
  const outro = afterQuestion
    ? "\n\n--- *Supuestos y primer borrador (para afinar después):* ---\n" + afterQuestion
    : "";

  return beforeQuestion + "\n\n" + intro + chosen.question + outro;
}
