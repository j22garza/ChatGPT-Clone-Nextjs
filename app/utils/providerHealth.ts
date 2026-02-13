/**
 * In-memory cache for provider health: disabled (invalid key) and cooldown (rate limit).
 * NOT exposed to the client; internal logs only.
 */

export type LLMProviderName = "openai" | "groq" | "anthropic";

const DISABLED_TTL_MS = 10 * 60 * 1000; // 10 minutes for invalid key

interface Entry {
  until: number; // timestamp
}

const disabledUntil: Partial<Record<LLMProviderName, number>> = {};
const cooldownUntil: Partial<Record<LLMProviderName, number>> = {};

function now(): number {
  return Date.now();
}

/** Mark provider as disabled (e.g. 401 invalid_api_key) for 10 minutes. */
export function setProviderDisabled(provider: LLMProviderName): void {
  disabledUntil[provider] = now() + DISABLED_TTL_MS;
}

/** Set cooldown in seconds (e.g. from Retry-After header). */
export function setProviderCooldown(provider: LLMProviderName, seconds: number): void {
  cooldownUntil[provider] = now() + Math.min(seconds * 1000, DISABLED_TTL_MS);
}

/** Returns true if the provider should be skipped for this request. */
export function isProviderUnavailable(provider: LLMProviderName): boolean {
  const d = disabledUntil[provider];
  if (d != null && d > now()) return true;
  const c = cooldownUntil[provider];
  if (c != null && c > now()) return true;
  return false;
}

/** Clear expired entries (optional maintenance). */
export function pruneExpired(): void {
  const n = now();
  for (const k of Object.keys(disabledUntil) as LLMProviderName[]) {
    if (disabledUntil[k]! <= n) delete disabledUntil[k];
  }
  for (const k of Object.keys(cooldownUntil) as LLMProviderName[]) {
    if (cooldownUntil[k]! <= n) delete cooldownUntil[k];
  }
}

/** For internal logs: which providers are currently disabled/cooldown. */
export function getUnavailableReasons(): Record<string, string> {
  const n = now();
  const out: Record<string, string> = {};
  for (const p of Object.keys(disabledUntil) as LLMProviderName[]) {
    if (disabledUntil[p]! > n) out[p] = "disabled";
  }
  for (const p of Object.keys(cooldownUntil) as LLMProviderName[]) {
    if (cooldownUntil[p]! > n) out[p] = "cooldown";
  }
  return out;
}
