import query from "@/app/utils/queryApi";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  answer: string;
  stepIndex?: number;
  state?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "Método no permitido" });
  }

  const { prompt, chatId, model, session, history } = req.body as {
    prompt?: string;
    chatId?: string;
    model?: string;
    session?: { user?: { email?: string } };
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ answer: "Por favor proporciona una consulta válida" });
  }
  if (!chatId || typeof chatId !== "string") {
    return res.status(400).json({ answer: "Por favor proporciona un ID de chat válido" });
  }
  if (!session?.user?.email) {
    return res.status(401).json({ answer: "Sesión no válida. Por favor inicia sesión nuevamente." });
  }

  const previousMessages = Array.isArray(history)
    ? history.slice(-10)
    : [];

  console.log(`[askQuestion] chat: ${chatId}, user: ${session.user.email}, history: ${previousMessages.length} msgs`);

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: La consulta tardó más de 60 segundos")), 60000)
    );
    const result = await Promise.race([
      query(prompt.trim(), chatId, model || "gpt-4o-mini", previousMessages),
      timeoutPromise,
    ]);

    if (!result.answer || result.answer.trim() === "") {
      throw new Error("Connie no pudo generar una respuesta. La respuesta está vacía.");
    }

    return res.status(200).json({
      answer: result.answer,
      stepIndex: result.derivedState?.stepIndex,
      state: result.derivedState?.state,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la consulta.";
    console.error("[askQuestion]", error);
    return res.status(500).json({ answer: message });
  }
}
