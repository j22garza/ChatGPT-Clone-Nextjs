"use client";

import Chat from "@/app/components/Chat";
import ChatInput from "@/app/components/ChatInput";
import { motion } from "framer-motion";
import React from "react";

type Props = {
  params: {
    id: string;
  };
};

function ChatPage({ params: { id } }: Props) {
  return (
    <div className="flex flex-col h-full">
      <Chat chatId={id} />
      <ChatInput chatId={id} />
    </div>
  );
}

export default ChatPage;