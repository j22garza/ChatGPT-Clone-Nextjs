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
    let previousMessages: any[] = [];
    try {
      const messagesRef = adminDb
        .collection("users")
        .doc(session?.user?.email)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limit(10);

      const messagesSnapshot = await messagesRef.get();
      previousMessages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          role: data.user.name === "Connie" ? "assistant" : "user",
          content: data.text
        };
      });
    } catch (firebaseError: any) {
      console.warn("Error getting previous messages, continuing without context:", firebaseError.message);
    }

    // Query Connie AI with timeout
    const queryPromise = query(prompt, chatId, model, previousMessages);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La consulta tardó demasiado")), 60000)
    );

    const response = await Promise.race([queryPromise, timeoutPromise]) as string;

    if (!response || response.trim() === "") {
      throw new Error("Connie no pudo generar una respuesta");
    }

    const message: Message = {
      text: response,
      createdAt: admin.firestore.Timestamp.now(),
      user: {
        name: "Connie",
        email: "connie@conexus.ai",
        avatar: "https://ui-avatars.com/api/?name=Connie&background=1e3a8a&color=fff&bold=true",
      },
    };

    try {
      await adminDb
        .collection("users")
        .doc(session?.user?.email)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add(message);
    } catch (firebaseError: any) {
      console.error("Error saving message to Firebase:", firebaseError);
      // Still return the response even if Firebase fails
    }

    res.status(200).json({ answer: message.text });
  } catch (error: any) {
    console.error("Error in askQuestion:", error);
    const errorMessage = error.message || "Error al procesar la consulta. Por favor intenta de nuevo.";
    res.status(500).json({ answer: errorMessage });
  }
}