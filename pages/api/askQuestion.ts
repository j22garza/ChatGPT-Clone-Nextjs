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
  // Solo permitir POST
  if (req.method !== "POST") {
    res.status(405).json({ answer: "Método no permitido" });
    return;
  }

  const { prompt, chatId, model, session } = req.body;

  console.log("askQuestion API called:", { 
    hasPrompt: !!prompt, 
    hasChatId: !!chatId, 
    hasSession: !!session,
    model 
  });

  if (!prompt) {
    console.error("Missing prompt");
    res.status(400).json({ answer: "Por favor proporciona una consulta" });
    return;
  }

  if (!chatId) {
    console.error("Missing chatId");
    res.status(400).json({ answer: "Por favor proporciona un ID de chat válido" });
    return;
  }

  if (!session?.user?.email) {
    console.error("Missing session");
    res.status(401).json({ answer: "Sesión no válida" });
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
    console.log("Calling query API...");
    const queryPromise = query(prompt, chatId, model || "gpt-4o-mini", previousMessages);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La consulta tardó demasiado")), 60000)
    );

    const response = await Promise.race([queryPromise, timeoutPromise]) as string;
    console.log("Query API response received, length:", response?.length || 0);

    if (!response || response.trim() === "") {
      console.error("Empty response from query API");
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
      console.log("Saving message to Firebase...");
      await adminDb
        .collection("users")
        .doc(session?.user?.email)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add(message);
      console.log("Message saved successfully");
    } catch (firebaseError: any) {
      console.error("Error saving message to Firebase:", firebaseError);
      // Still return the response even if Firebase fails
    }

    console.log("Sending success response");
    res.status(200).json({ answer: message.text });
  } catch (error: any) {
    console.error("Error in askQuestion:", error);
    console.error("Error stack:", error.stack);
    const errorMessage = error.message || "Error al procesar la consulta. Por favor intenta de nuevo.";
    res.status(500).json({ answer: errorMessage });
  }
}