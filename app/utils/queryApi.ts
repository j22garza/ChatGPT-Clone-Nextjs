import { OpenAI } from "openai";

// Función para buscar en internet usando Tavily
const searchWeb = async (query: string): Promise<string> => {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      return "";
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: "basic",
        max_results: 3,
      }),
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const results = data.results || [];
    
    const formattedResults = results
      .map((result: any, index: number) => {
        return `[Fuente ${index + 1}]: ${result.title}\n${result.content}\nURL: ${result.url}`;
      })
      .join("\n\n");

    return formattedResults;
  } catch (error: any) {
    console.error("Error en búsqueda web:", error.message);
    return "";
  }
};

const query = async (prompt: string, chatId: string, model: string, messages: any[] = []) => {
  const systemPrompt = `Eres Connie, un asistente virtual especializado en EHS (Environmental, Health, and Safety) de Conexus. 
Tu objetivo es ayudar a empresas con:
- Seguridad industrial
- Salud ocupacional  
- Medio ambiente
- Prevención de riesgos
- Protección civil

Debes:
1. Identificar riesgos industriales y/o ambientales
2. Proporcionar análisis de riesgo básico basado en inputs del usuario
3. Ofrecer soluciones tecnológicas o controles personalizados
4. Sugerir mínimo 3 proveedores adecuados cuando sea relevante
5. Funcionar como consultor completo en temas de EHS (investigación de incidentes, AST, etc.)
6. Basar tus respuestas en normativas NOM, OSHA e internacionales
7. Si tienes información de búsqueda web, úsala para enriquecer tu respuesta con datos actualizados

Sé profesional, claro y conciso. Responde en español. Usa formato Markdown para estructurar tus respuestas.`;

  try {
    // Determinar qué proveedor usar
    const groqApiKey = process.env.GROQ_API_KEY;
    const openaiApiKey = process.env.CHAT_GPT_KEY;
    const providerEnv = process.env.LLM_PROVIDER?.toLowerCase();
    
    let useGroq = false;
    if (providerEnv === 'groq' && groqApiKey) {
      useGroq = true;
    } else if (!providerEnv && groqApiKey) {
      // Auto-detect: usar Groq si está disponible
      useGroq = true;
    }
    
    if (!useGroq && !openaiApiKey) {
      throw new Error("No hay API keys configuradas. Configura GROQ_API_KEY o CHAT_GPT_KEY en Vercel.");
    }

    // Búsqueda web si es necesario
    const needsWebSearch = 
      prompt.toLowerCase().includes("actual") ||
      prompt.toLowerCase().includes("reciente") ||
      prompt.toLowerCase().includes("último") ||
      prompt.toLowerCase().includes("nuevo") ||
      prompt.toLowerCase().includes("buscar") ||
      prompt.toLowerCase().includes("normativa") ||
      prompt.toLowerCase().includes("regulación") ||
      prompt.toLowerCase().includes("proveedor");

    let webSearchResults = "";
    if (needsWebSearch) {
      webSearchResults = await searchWeb(prompt);
    }

    const messageHistory = messages.slice(-10);
    
    let enhancedPrompt = prompt;
    if (webSearchResults) {
      enhancedPrompt = `${prompt}\n\n--- Información actualizada de internet ---\n${webSearchResults}\n--- Fin de información web ---\n\nUsa esta información para enriquecer tu respuesta.`;
    }
    
    const modelToUse = model || (useGroq ? "llama-3.1-70b-versatile" : "gpt-4o-mini");
    
    // Crear cliente según el proveedor
    let client: OpenAI;
    if (useGroq) {
      client = new OpenAI({
        apiKey: groqApiKey!,
        baseURL: "https://api.groq.com/openai/v1",
      });
    } else {
      client = new OpenAI({
        apiKey: openaiApiKey!,
      });
    }
    
    console.log(`[queryApi] Using ${useGroq ? 'Groq' : 'OpenAI'} with model: ${modelToUse}`);
    
    // Llamar a la API
    const response = await client.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        ...messageHistory,
        { role: "user", content: enhancedPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content || content.trim() === '') {
      throw new Error("Respuesta vacía del modelo");
    }
    
    console.log(`[queryApi] Success! Response length: ${content.length}`);
    return content;
    
  } catch (err: any) {
    console.error(`[queryApi] Error:`, err);
    
    // Mensajes de error más específicos
    if (err.message?.includes('API key') || err.message?.includes('authentication')) {
      return `Error de autenticación: Verifica que las API keys estén correctamente configuradas en Vercel. ${err.message}`;
    }
    
    if (err.message?.includes('rate limit') || err.message?.includes('quota')) {
      return `Límite de uso alcanzado: ${err.message}. Intenta más tarde o verifica tu plan.`;
    }
    
    if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
      return "La consulta tardó demasiado. Intenta con una pregunta más corta.";
    }
    
    return `Error al procesar tu consulta: ${err.message || 'Error desconocido'}. Por favor intenta de nuevo.`;
  }
};

export default query;
