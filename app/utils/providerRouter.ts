/**
 * Model Router: orden de proveedores por prioridad, readiness y salud.
 * groq -> openai -> anthropic con fallback silencioso.
 */

import type { LLMProvider } from "./llmProviders";
import { hasProviderKey } from "./llmProviders";
import { isProviderUnavailable } from "./providerHealth";
import type { ReadinessLevel } from "./conversationReadiness";

const PROVIDER_ORDER: LLMProvider[] = ["groq", "openai", "anthropic"];

/** Cheap/fast models for LOW/MEDIUM (exploration, single question). */
const CHEAP_MODEL_PREFERENCE: Partial<Record<LLMProvider, string>> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
};

/** Stable/strong models for HIGH (tablas, análisis completo). */
const STABLE_MODEL_PREFERENCE: Partial<Record<LLMProvider, string>> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
};

export interface RouterOptions {
  /** User-selected model from UI (e.g. "gpt-4o-mini"); if set, prefer provider that supports it. */
  userModel?: string;
  /** LOW | MEDIUM -> cheap/fast; HIGH -> stable. */
  readinessLevel?: ReadinessLevel;
}

/**
 * Returns ordered list of providers to try for this request.
 * - Only providers with API key and not disabled/cooldown.
 * - If userModel is set, the provider that supports it is tried first (if available).
 * - Otherwise order: groq -> openai -> anthropic (cheap first), or for HIGH readiness prefer openai/anthropic stable.
 */
export function getCandidateProviders(options: RouterOptions = {}): LLMProvider[] {
  const { userModel, readinessLevel = "LOW" } = options;

  const withKeys = PROVIDER_ORDER.filter((p) => hasProviderKey(p) && !isProviderUnavailable(p));

  if (withKeys.length === 0) return [];

  // If user chose a model, try to put the provider that supports it first
  if (userModel) {
    const byModel: Record<string, LLMProvider> = {
      "gpt-4o-mini": "openai",
      "gpt-4o": "openai",
      "gpt-4-turbo": "openai",
      "llama-3.3-70b-versatile": "groq",
      "llama-3.1-8b-instant": "groq",
      "claude-3-5-sonnet-20241022": "anthropic",
      "claude-3-haiku-20240307": "anthropic",
    };
    const preferred = byModel[userModel];
    if (preferred && withKeys.includes(preferred)) {
      const rest = withKeys.filter((p) => p !== preferred);
      return [preferred, ...rest];
    }
  }

  // For HIGH readiness, prefer openai/anthropic (more stable for tables) but still allow groq
  if (readinessLevel === "HIGH") {
    const stable = ["openai", "anthropic", "groq"].filter((p) =>
      withKeys.includes(p as LLMProvider)
    ) as LLMProvider[];
    if (stable.length > 0) return stable;
  }

  return withKeys;
}

/** Suggested model for a provider given readiness (for logging / actual call). */
export function getSuggestedModel(provider: LLMProvider, readinessLevel: ReadinessLevel): string {
  if (readinessLevel === "HIGH") {
    return STABLE_MODEL_PREFERENCE[provider] ?? (provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini");
  }
  return CHEAP_MODEL_PREFERENCE[provider] ?? (provider === "anthropic" ? "claude-3-haiku-20240307" : "gpt-4o-mini");
}
