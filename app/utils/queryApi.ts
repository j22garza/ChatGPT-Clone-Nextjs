import openai from "./chatgpt";

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
7. Si necesitas información actualizada, menciona que puedes buscar en internet pero proporciona la mejor respuesta basada en tu conocimiento

Sé profesional, claro y conciso. Responde en español. Usa formato Markdown para estructurar tus respuestas.`;

  try {
    // Build message history
    const messageHistory = messages.slice(-10); // Last 10 messages for context
    
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messageHistory,
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "Connie no pudo responder en este momento.";
  } catch (err: any) {
    console.error(`Connie unable to find an answer: ${err.message}`);
    return "Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.";
  }
};

export default query;