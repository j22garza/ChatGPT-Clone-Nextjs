// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { adminDb } from "@/app/firebase/firebaseAdmin";
import query from "@/app/utils/queryApi";
import admin from "firebase-admin";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  answer: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { prompt, chatId, model, session } = req.body;

  if (!prompt) {
    res.status(400).json({ answer: "Por favor proporciona una consulta" });
    return;
  }

  if (!chatId) {
    res.status(400).json({ answer: "Por favor proporciona un ID de chat válido" });
    return;
  }

  try {
    // Get previous messages for context
    const messagesRef = adminDb
      .collection("users")
      .doc(session?.user?.email)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(10);

    const messagesSnapshot = await messagesRef.get();
    const previousMessages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        role: data.user.name === "Connie" ? "assistant" : "user",
        content: data.text
      };
    });

    // Query Connie AI
    const response = await query(prompt, chatId, model, previousMessages);

    const message: Message = {
      text: response || "Lo siento, Connie no pudo responder en este momento.",
      createdAt: admin.firestore.Timestamp.now(),
      user: {
        name: "Connie",
        email: "connie@conexus.ai",
        avatar: "https://ui-avatars.com/api/?name=Connie&background=1e3a8a&color=fff&bold=true",
      },
    };

    await adminDb
      .collection("users")
      .doc(session?.user?.email)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add(message);

    res.status(200).json({ answer: message.text });
  } catch (error: any) {
    console.error("Error in askQuestion:", error);
    res.status(500).json({ answer: "Error al procesar la consulta. Por favor intenta de nuevo." });
  }
}