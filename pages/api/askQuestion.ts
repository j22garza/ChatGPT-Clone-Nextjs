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
    return res.status(405).json({ answer: "Método no permitido" });
  }

  const { prompt, chatId, model, session } = req.body;

  // Validaciones básicas
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ answer: "Por favor proporciona una consulta válida" });
  }

  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({ answer: "Por favor proporciona un ID de chat válido" });
  }

  if (!session?.user?.email) {
    return res.status(401).json({ answer: "Sesión no válida. Por favor inicia sesión nuevamente." });
  }

  console.log(`[askQuestion] Processing request for chat: ${chatId}, user: ${session.user.email}`);

  try {
    // Obtener mensajes previos para contexto
    let previousMessages: any[] = [];
    try {
      const messagesRef = adminDb
        .collection("users")
        .doc(session.user.email)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limit(10);

      const messagesSnapshot = await messagesRef.get();
      previousMessages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          role: data.user?.name === "Connie" ? "assistant" : "user",
          content: data.text || ""
        };
      }).filter(msg => msg.content); // Filtrar mensajes vacíos
      
      console.log(`[askQuestion] Found ${previousMessages.length} previous messages for context`);
    } catch (firebaseError: any) {
      console.warn("[askQuestion] Error getting previous messages, continuing without context:", firebaseError.message);
    }

    // Llamar a la API de Connie con timeout
    console.log("[askQuestion] Calling query API...");
    const queryPromise = query(prompt.trim(), chatId, model || "gpt-4o-mini", previousMessages);
    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: La consulta tardó más de 60 segundos")), 60000)
    );

    const response = await Promise.race([queryPromise, timeoutPromise]) as string;

    if (!response || response.trim() === "") {
      throw new Error("Connie no pudo generar una respuesta. La respuesta está vacía.");
    }

    console.log(`[askQuestion] Got response, length: ${response.length}`);

    // Guardar respuesta en Firebase
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
        .doc(session.user.email)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add(message);
      console.log("[askQuestion] Message saved to Firebase successfully");
    } catch (firebaseError: any) {
      console.error("[askQuestion] Error saving message to Firebase:", firebaseError);
      // Continuar aunque falle Firebase, al menos devolver la respuesta
    }

    // Devolver respuesta exitosa
    return res.status(200).json({ answer: response });
    
  } catch (error: any) {
    console.error("[askQuestion] Error:", error);
    console.error("[askQuestion] Error stack:", error.stack);
    
    const errorMessage = error.message || "Error al procesar la consulta. Por favor intenta de nuevo.";
    
    // Devolver error con código 500
    return res.status(500).json({ answer: errorMessage });
  }
}
