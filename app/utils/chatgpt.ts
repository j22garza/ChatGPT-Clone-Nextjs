import { OpenAI } from "openai";

if (!process.env.CHAT_GPT_KEY) {
  console.warn("CHAT_GPT_KEY no está configurada. OpenAI no funcionará hasta que se configure.");
}

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_KEY || "dummy-key", // Dummy para evitar error de inicialización
});

export default openai;