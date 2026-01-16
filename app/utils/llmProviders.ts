// Configuración de diferentes proveedores de LLM
export type LLMProvider = 'openai' | 'groq';

export interface LLMConfig {
  name: string;
  speed: 'ultra-fast' | 'fast';
  cost: 'free' | 'low';
  model: string;
  apiKey: string;
  endpoint?: string;
}

// Configuración de proveedores disponibles
export const LLM_PROVIDERS: Record<LLMProvider, LLMConfig> = {
  openai: {
    name: 'OpenAI GPT-4o-mini',
    speed: 'fast',
    cost: 'low',
    model: 'gpt-4o-mini',
    apiKey: process.env.CHAT_GPT_KEY || '',
  },
  groq: {
    name: 'Groq (Ultra Fast)',
    speed: 'ultra-fast',
    cost: 'free',
    model: 'llama-3.1-70b-versatile',
    apiKey: process.env.GROQ_API_KEY || '',
    endpoint: 'https://api.groq.com/openai/v1',
  },
};

// Obtener el proveedor activo desde variables de entorno
export function getActiveProvider(): LLMProvider {
  // Si hay LLM_PROVIDER configurado, intentar usarlo
  const configuredProvider = process.env.LLM_PROVIDER?.toLowerCase() as LLMProvider;
  
  if (configuredProvider && LLM_PROVIDERS[configuredProvider]?.apiKey) {
    console.log(`Using configured provider: ${configuredProvider}`);
    return configuredProvider;
  }
  
  // Si no hay proveedor configurado o no tiene API key, detectar automáticamente
  // Prioridad: Groq (más rápido) > OpenAI
  if (process.env.GROQ_API_KEY && LLM_PROVIDERS.groq.apiKey) {
    console.log("Auto-detected: Using Groq (has API key)");
    return 'groq';
  }
  
  if (process.env.CHAT_GPT_KEY && LLM_PROVIDERS.openai.apiKey) {
    console.log("Auto-detected: Using OpenAI (has API key)");
    return 'openai';
  }
  
  // Fallback final
  console.warn("No API keys found, defaulting to OpenAI");
  return 'openai';
}

