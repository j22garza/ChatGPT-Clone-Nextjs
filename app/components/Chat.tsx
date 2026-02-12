"use client";

import { useEffect, useRef } from "react";
import Message from "./Message";
import HomeContent from "./HomeContent";
import { useChat } from "../context/ChatContext";
import { useAutoScroll } from "../hooks/useAutoScroll";

type Props = { chatId: string };

function Chat({ chatId }: Props) {
  const { getMessages, ensureMessagesLoaded } = useChat();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) ensureMessagesLoaded(chatId);
  }, [chatId, ensureMessagesLoaded]);

  const messages = chatId ? getMessages(chatId) : [];
  useAutoScroll(scrollContainerRef, messages.length);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-52 custom-scrollbar"
        style={{ contain: "layout style" }}
      >
      {messages.length === 0 && (
        <div className="min-h-full flex items-center justify-center">
          <HomeContent />
        </div>
      )}
      <div className="max-w-3xl w-full ml-[10%] mr-auto px-3 sm:px-5">
        {messages.map((message, i) => (
          <Message key={i} message={message} />
        ))}
      </div>
      <div aria-hidden className="h-1" />
      </div>
    </div>
  );
}

export default Chat;
