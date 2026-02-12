"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import Message from "./Message";
import HomeContent from "./HomeContent";
import { useChat } from "../context/ChatContext";

type Props = { chatId: string };

function Chat({ chatId }: Props) {
  const { data: session } = useSession();
  const { getMessages, ensureMessagesLoaded } = useChat();
  const messageEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) ensureMessagesLoaded(chatId);
  }, [chatId, ensureMessagesLoaded]);

  const messages = chatId ? getMessages(chatId) : [];

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 custom-scrollbar">
      {messages.length === 0 && (
        <div className="min-h-full flex items-center justify-center">
          <HomeContent />
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {messages.map((message, i) => (
          <Message key={i} message={message} />
        ))}
      </div>
      <div ref={messageEndRef} />
    </div>
  );
}

export default Chat;
