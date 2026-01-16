"use client";

import { collection, orderBy, query } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import useSWR from "swr";

import Message from "./Message";
import { firestore } from "../firebase/firebase";
import HomeContent from "./HomeContent";

type Props = {
  chatId: string;
};

function Chat({ chatId }: Props) {
  const { data: session } = useSession();
  const messageEndRef = useRef<null | HTMLDivElement>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const { data: model } = useSWR("model", {
    fallbackData: "gpt-4o-mini",
  });

  const [messages] = useCollection(
    session &&
      query(
        collection(
          firestore,
          `users/${session?.user?.email!}/chats/${chatId}/messages`
        ),
        orderBy("createdAt", "asc")
      )
  );

  // Auto-enviar mensaje si hay un mensaje del usuario sin respuesta
  useEffect(() => {
    if (!messages || hasAutoSent || !session) return;

    const messagesList = messages.docs.map(doc => doc.data());
    const lastMessage = messagesList[messagesList.length - 1];
    
    // Si el último mensaje es del usuario (no es Connie) y no hay respuesta
    if (lastMessage && lastMessage.user.name !== "Connie") {
      const hasResponse = messagesList.some(
        (msg, idx) => idx > messagesList.indexOf(lastMessage) && msg.user.name === "Connie"
      );
      
      if (!hasResponse) {
        setHasAutoSent(true);
        // Enviar automáticamente a la API
        fetch("/api/askQuestion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: lastMessage.text,
            chatId,
            model,
            session,
          }),
        }).catch((error) => {
          console.error("Error auto-sending message:", error);
          setHasAutoSent(false);
        });
      }
    }
  }, [messages, chatId, model, session, hasAutoSent]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 custom-scrollbar">
      {messages?.empty && (
        <div className="min-h-full flex items-center justify-center">
          <HomeContent/>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {messages?.docs.map((message) => (
          <Message key={message.id} message={message.data()} />
        ))}
      </div>
      <div ref={messageEndRef} />
    </div>
  );
}

export default Chat;