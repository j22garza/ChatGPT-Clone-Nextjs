import query from "@/app/utils/queryApi";
import { getGracefulFallbackResponse } from "@/app/utils/gracefulFallbackResponse";
import { getProvidersWithKeys } from "@/app/utils/llmProviders";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = { answer: string; stepIndex?: number; state?: string; meta?: { usedProvider?: string; fallbackUsed?: boolean } };

function hasAnyApiKey(): boolean {
  return getProvidersWithKeys().length > 0;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
        answer: "No hay API key configurada. Añade al menos una: CHAT_GPT_KEY, OPENAI_API_KEY, GROQ_API_KEY o ANTHROPIC_API_KEY.",
      });
    }

    const previousMessages = Array.isArray(history)
      ? history.slice(-10).filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      : [];
    const requestId = generateRequestId();

    console.log(`[askQuestion] request_id=${requestId} chat=${chatId} user=${session.user.email} history=${previousMessages.length} msgs`);

    const timeoutMs = 90000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    );
    const result = await Promise.race([
      query(prompt.trim(), chatId, model || "gpt-4o-mini", previousMessages, requestId),
      timeoutPromise,
    ]);

    if (!result?.answer || typeof result.answer !== "string" || !result.answer.trim()) {
      return sendJson(200, {
        answer: getGracefulFallbackResponse(),
        stepIndex: result?.derivedState?.stepIndex,
        state: result?.derivedState?.state,
        meta: { usedProvider: "none", fallbackUsed: true },
      });
    }

    return sendJson(200, {
      answer: result.answer,
      stepIndex: result.derivedState?.stepIndex,
      state: result.derivedState?.state,
      ...(result.meta && { meta: result.meta }),
    });
  } catch (error: unknown) {
    console.error("[askQuestion] request_id=", (error as { requestId?: string })?.requestId ?? "unknown", error);
    return sendJson(200, {
      answer: getGracefulFallbackResponse(),
      meta: { usedProvider: "none", fallbackUsed: true },
    });
  }
}
