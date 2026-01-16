import openai from "./chatgpt";
import { getActiveProvider, LLM_PROVIDERS, type LLMProvider } from "./llmProviders";

// Función para buscar en internet usando Tavily
const searchWeb = async (query: string): Promise<string> => {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.warn("TAVILY_API_KEY no configurada, omitiendo búsqueda web");
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
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];
    
    // Formatear resultados para el contexto
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
  // System prompt for Connie - EHS Specialist AI
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
    // Obtener proveedor activo primero
    const activeProvider = getActiveProvider();
    const providerConfig = LLM_PROVIDERS[activeProvider];
    
    console.log(`[queryApi] Using provider: ${activeProvider}, model: ${providerConfig.model}`);
    
    // Verificar que la API key esté configurada según el proveedor
    if (!providerConfig.apiKey || providerConfig.apiKey.trim() === '') {
      const errorMsg = `${providerConfig.name} API key no está configurada. Verifica las variables de entorno.`;
      console.error(`[queryApi] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    console.log(`[queryApi] API key found for ${activeProvider}`);

    // Detectar si la consulta requiere búsqueda web
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

    // Build message history
    const messageHistory = messages.slice(-10); // Last 10 messages for context
    
    // Construir el prompt con información web si está disponible
    let enhancedPrompt = prompt;
    if (webSearchResults) {
      enhancedPrompt = `${prompt}\n\n--- Información actualizada de internet ---\n${webSearchResults}\n--- Fin de información web ---\n\nUsa esta información para enriquecer tu respuesta.`;
    }
    
    // Usar modelo del proveedor o el especificado
    const modelToUse = model || providerConfig.model;
    
    // Optimización: Reducir max_tokens para respuestas más rápidas
    // Para EHS, 1500 tokens es suficiente para respuestas completas
    let response;
    
    console.log(`[queryApi] Calling ${activeProvider} API with model: ${modelToUse}`);
    
    if (activeProvider === 'groq' && providerConfig.apiKey) {
      // Groq usa endpoint compatible con OpenAI
      const { OpenAI: GroqOpenAI } = await import("openai");
      const groqClient = new GroqOpenAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.endpoint,
      });
      
      console.log(`[queryApi] Making Groq API call...`);
      response = await groqClient.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...messageHistory,
          { role: "user", content: enhancedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      console.log(`[queryApi] Groq response received`);
    } else {
      // OpenAI por defecto (o fallback)
      console.log(`[queryApi] Making OpenAI API call...`);
      response = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...messageHistory,
          { role: "user", content: enhancedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false,
      });
      console.log(`[queryApi] OpenAI response received`);
    }

    const content = response.choices[0]?.message?.content;
    if (!content || content.trim() === '') {
      console.error(`[queryApi] Empty response from ${activeProvider}`);
      throw new Error(`Respuesta vacía de ${providerConfig.name}`);
    }
    
    console.log(`[queryApi] Success! Response length: ${content.length}`);
    return content;
  } catch (err: any) {
    console.error(`[queryApi] Error: ${err.message}`);
    console.error(`[queryApi] Error stack:`, err.stack);
    
    // Retornar error más descriptivo
    if (err.message.includes('API key')) {
      return `Error de configuración: ${err.message}. Por favor verifica las variables de entorno en Vercel.`;
    }
    
    if (err.message.includes('timeout') || err.message.includes('Timeout')) {
      return "La consulta tardó demasiado en procesarse. Por favor intenta de nuevo con una pregunta más corta.";
    }
    
    return `Lo siento, hubo un error al procesar tu consulta: ${err.message}. Por favor intenta de nuevo.`;
  }
};

export default query;