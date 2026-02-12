/**
 * Risk scoring helper: P×E×C matrix (1–5 each), normalized 1–25, level bands.
 * When user has not given numbers, suggests ranges and marks as "estimación preliminar".
 */

export type RiskLevel = "bajo" | "moderado" | "medio-alto" | "alto";

export interface RiskScoreResult {
  P: number;
  E: number;
  C: number;
  bruto: number;
  norm: number;
  level: RiskLevel;
  isEstimate: boolean;
  suggestion?: string;
}

const LEVEL_BANDS: { max: number; level: RiskLevel }[] = [
  { max: 8, level: "bajo" },
  { max: 12, level: "moderado" },
  { max: 18, level: "medio-alto" },
  { max: 25, level: "alto" },
];

function getLevel(norm: number): RiskLevel {
  for (const band of LEVEL_BANDS) {
    if (norm <= band.max) return band.level;
  }
  return "alto";
}

/**
 * Parse P, E, C from user text (e.g. "P=3 E=4 C=2" or "probabilidad 3, exposición 4").
 */
function parsePECFromText(text: string): { P?: number; E?: number; C?: number } {
  const out: { P?: number; E?: number; C?: number } = {};
  // P=3, P: 3, probabilidad 3
  const pMatch = text.match(/\b[Pp](?:robabilidad)?\s*[=:]\s*([1-5])/i) ?? text.match(/probabilidad\s+(\d)/i);
  if (pMatch) out.P = Math.min(5, Math.max(1, parseInt(pMatch[1], 10)));
  const eMatch = text.match(/\b[Ee](?:xposición)?\s*[=:]\s*([1-5])/i) ?? text.match(/exposición\s+(\d)/i);
  if (eMatch) out.E = Math.min(5, Math.max(1, parseInt(eMatch[1], 10)));
  const cMatch = text.match(/\b[Cc](?:onsecuencia)?\s*[=:]\s*([1-5])/i) ?? text.match(/consecuencia\s+(\d)/i);
  if (cMatch) out.C = Math.min(5, Math.max(1, parseInt(cMatch[1], 10)));
  return out;
}

/**
 * Heuristic: suggest E (exposición) from phrases like "diario", "muchas personas".
 */
function suggestExposure(text: string): number | undefined {
  const t = text.toLowerCase();
  if (/\b(diario|turno\s*completo|todas?\s*los?\s*días|continuo|muchas?\s*personas?)\b/.test(t)) return 4;
  if (/\b(semanal|varias?\s*veces|algunos?\s*empleados?)\b/.test(t)) return 3;
  if (/\b(ocasional|raro|pocas?\s*personas?)\b/.test(t)) return 2;
  return undefined;
}

/**
 * When user has given P/E/C (or we can parse them), compute score and level.
 */
export function computeRiskScore(
  recentMessages: { role: string; content: string }[],
  currentPrompt: string
): RiskScoreResult | null {
  const fullText = recentMessages.map((m) => m.content).join("\n") + "\n" + currentPrompt;
  const parsed = parsePECFromText(fullText);

  const P = parsed.P ?? suggestExposure(fullText) ?? 0;
  const E = parsed.E ?? 0;
  const C = parsed.C ?? 0;

  const hasAny = P >= 1 && P <= 5 && E >= 1 && E <= 5 && C >= 1 && C <= 5;
  if (!hasAny) {
    const suggestedE = suggestExposure(fullText);
    if (suggestedE !== undefined) {
      return {
        P: 3,
        E: suggestedE,
        C: 3,
        bruto: 3 * suggestedE * 3,
        norm: Math.round((3 * suggestedE * 3) / 5),
        level: getLevel(Math.round((3 * suggestedE * 3) / 5)),
        isEstimate: true,
        suggestion:
          "Estimación preliminar por frecuencia/exposición mencionada. P y C asumidos en 3. Pide al usuario confirmar P, E, C (1-5) para afinar.",
      };
    }
    return null;
  }

  const pVal = parsed.P ?? 3;
  const eVal = parsed.E ?? 3;
  const cVal = parsed.C ?? 3;
  const bruto = pVal * eVal * cVal;
  const norm = Math.round(bruto / 5);
  const clampedNorm = Math.min(25, Math.max(1, norm));

  return {
    P: pVal,
    E: eVal,
    C: cVal,
    bruto,
    norm: clampedNorm,
    level: getLevel(clampedNorm),
    isEstimate: !parsed.P || !parsed.E || !parsed.C,
  };
}

/**
 * Format risk context block to inject into user message (for LLM to explain, not invent).
 */
export function formatRiskContextForPrompt(result: RiskScoreResult): string {
  const lines = [
    "--- Contexto de riesgo (usa solo para explicar y justificar; no inventes valores) ---",
    `P=${result.P}, E=${result.E}, C=${result.C} → Puntaje bruto = ${result.bruto}, Normalizado = ${result.norm}, Nivel = ${result.level}.`,
  ];
  if (result.isEstimate && result.suggestion) {
    lines.push(`Estimación preliminar: ${result.suggestion}`);
  }
  lines.push("--- Fin contexto riesgo ---");
  return lines.join("\n");
}
