// Configuración de diferentes proveedores de LLM (una sola fuente de verdad)
export type LLMProvider = "openai" | "groq" | "anthropic";

export interface LLMConfig {
  name: string;
  speed: "ultra-fast" | "fast";
  cost: "free" | "low";
  model: string;
  apiKey: string;
  endpoint?: string;
}

export const LLM_PROVIDERS: Record<LLMProvider, LLMConfig> = {
  openai: {
    name: "OpenAI GPT-4o-mini",
    speed: "fast",
    cost: "low",
    model: "gpt-4o-mini",
    apiKey: process.env.CHAT_GPT_KEY || process.env.OPENAI_API_KEY || "",
  },
  groq: {
    name: "Groq (Ultra Fast)",
    speed: "ultra-fast",
    cost: "free",
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY || "",
    endpoint: "https://api.groq.com/openai/v1",
  },
  anthropic: {
    name: "Anthropic Claude",
    speed: "fast",
    cost: "low",
    model: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },
};

/** Modelos permitidos por proveedor (para validar selección del usuario) */
export const ALLOWED_MODELS: Record<LLMProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
};

/** Opciones para el selector de modelos (getEngines) */
export const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI)" },
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Groq)" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Anthropic)" },
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Anthropic)" },
];

/** True if provider has a non-empty API key (no validation of validity). */
export function hasProviderKey(provider: LLMProvider): boolean {
  const key = LLM_PROVIDERS[provider]?.apiKey;
  return typeof key === "string" && key.trim().length > 0;
}

/** All providers that have a key set. */
export function getProvidersWithKeys(): LLMProvider[] {
  return (["openai", "groq", "anthropic"] as const).filter(hasProviderKey);
}

/** Obtener el proveedor activo según env (prioridad: LLM_PROVIDER > OpenAI > Groq > Anthropic). */
export function getActiveProvider(): LLMProvider {
  const configured = process.env.LLM_PROVIDER?.toLowerCase() as LLMProvider | undefined;
  if (configured && LLM_PROVIDERS[configured]?.apiKey) {
    return configured;
  }
  if (LLM_PROVIDERS.openai.apiKey) return "openai";
  if (LLM_PROVIDERS.groq.apiKey) return "groq";
  if (LLM_PROVIDERS.anthropic.apiKey) return "anthropic";
  return "openai";
}

/** Obtener config del proveedor activo; lanza si no hay API key. */
export function getActiveProviderConfig(): LLMConfig {
  const provider = getActiveProvider();
  const config = LLM_PROVIDERS[provider];
  if (!config.apiKey) {
    throw new Error(
      "No hay API keys configuradas. Configura CHAT_GPT_KEY, OPENAI_API_KEY, GROQ_API_KEY o ANTHROPIC_API_KEY."
    );
  }
  return config;
}

/** Devuelve el modelo a usar: el solicitado si es válido para el proveedor, si no el por defecto. */
export function resolveModel(provider: LLMProvider, userModel: string | undefined): string {
  const config = LLM_PROVIDERS[provider];
  const allowed = ALLOWED_MODELS[provider];
  if (userModel && allowed.includes(userModel)) return userModel;
  return config.model;
}
