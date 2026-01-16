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
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase() as LLMProvider;
  
  // Verificar que el proveedor tenga API key configurada
  if (LLM_PROVIDERS[provider]?.apiKey) {
    return provider;
  }
  
  // Fallback a OpenAI si no hay API key del proveedor seleccionado
  return 'openai';
}

