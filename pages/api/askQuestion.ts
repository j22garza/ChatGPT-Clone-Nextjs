import query from "@/app/utils/queryApi";
import { LLM_PROVIDERS } from "@/app/utils/llmProviders";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = { answer: string; stepIndex?: number; state?: string };

function hasAnyApiKey(): boolean {
  return !!(LLM_PROVIDERS.openai.apiKey || LLM_PROVIDERS.groq.apiKey);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const sendJson = (status: number, body: Data) => {
    try {
      return res.status(status).json(body);
    } catch {
      return res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
    }
  };

  try {
    if (req.method !== "POST") {
      return sendJson(405, { answer: "Método no permitido" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { prompt, chatId, model, session, history } = body as {
      prompt?: string;
      chatId?: string;
      model?: string;
      session?: { user?: { email?: string } };
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return sendJson(400, { answer: "Por favor proporciona una consulta válida" });
    }
    if (!chatId || typeof chatId !== "string") {
      return sendJson(400, { answer: "Por favor proporciona un ID de chat válido" });
    }
    if (!session?.user?.email) {
      return sendJson(401, { answer: "Sesión no válida. Por favor inicia sesión nuevamente." });
    }
    if (!hasAnyApiKey()) {
      return sendJson(503, {
        answer: "No hay API key configurada. Añade CHAT_GPT_KEY o OPENAI_API_KEY (o GROQ_API_KEY) en las variables de entorno.",
      });
    }

    const previousMessages = Array.isArray(history)
      ? history.slice(-10).filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      : [];

    console.log(`[askQuestion] chat: ${chatId}, user: ${session.user.email}, history: ${previousMessages.length} msgs`);

    const timeoutMs = 90000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: La consulta tardó más de 90 segundos")), timeoutMs)
    );
    const result = await Promise.race([
      query(prompt.trim(), chatId, model || "gpt-4o-mini", previousMessages),
      timeoutPromise,
    ]);

    if (!result?.answer || typeof result.answer !== "string" || !result.answer.trim()) {
      return sendJson(500, { answer: "Connie no pudo generar una respuesta. La respuesta está vacía." });
    }

    return sendJson(200, {
      answer: result.answer,
      stepIndex: result.derivedState?.stepIndex,
      state: result.derivedState?.state,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la consulta.";
    console.error("[askQuestion]", error);
    return sendJson(500, { answer: message });
  }
}
