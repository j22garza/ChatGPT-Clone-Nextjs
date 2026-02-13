/**
 * Respuesta útil cuando todos los proveedores fallan.
 * NUNCA mencionar API, OpenAI, Groq, Claude, rate limit, token, key.
 */

export function getGracefulFallbackResponse(): string {
  return `No pude completar el análisis completo en este momento. Aquí tienes un primer paso para avanzar:

**Próximo paso sugerido**
¿Puedes contarme en una frase qué actividad o proceso te preocupa (por ejemplo: "soldadura en taller" o "manejo de químicos")? Con eso puedo orientarte mejor.

**Medidas generales de seguridad**
- Asegura que el personal tenga la capacitación necesaria para la tarea.
- Revisa que los controles existentes (EPP, procedimientos) estén en uso.
- Si hay duda sobre un riesgo, detén la actividad hasta evaluarla.

Cuando vuelva a estar disponible el análisis completo, podremos profundizar. ¿En qué te gustaría que sigamos?`;
}
