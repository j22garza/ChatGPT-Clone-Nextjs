"use client";

import { DocumentData } from "firebase/firestore";
import { motion } from "framer-motion";
import React from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  message: DocumentData;
};

function Message({ message }: Props) {
  const isConnie = message.user.name === "Connie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group py-6 px-4 md:px-6 lg:px-12 ${
        isConnie ? "" : ""
      }`}
    >
      <div className="flex items-start gap-4 max-w-3xl mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isConnie ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-lg">🤖</span>
            </div>
          ) : (
            <img 
              src={message.user.avatar} 
              alt={message.user.name} 
              className="w-8 h-8 rounded-lg object-cover" 
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Header - Solo para Connie */}
          {isConnie && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-white">Connie</span>
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md border border-blue-400/30">
                EHS
              </span>
            </div>
          )}
          
          {/* Message Content */}
          <div className={`prose prose-invert prose-sm max-w-none ${
            isConnie 
              ? "text-gray-100" 
              : "text-gray-300"
          }`}>
            <ReactMarkdown 
              className="leading-7 [&>p]:mb-4 [&>p:last-child]:mb-0
                       [&>ul]:my-4 [&>ol]:my-4 [&>li]:my-1
                       [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-base
                       [&>code]:bg-white/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm
                       [&>pre]:bg-white/5 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto
                       [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500/50 [&>blockquote]:pl-4 [&>blockquote]:italic"
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Message;