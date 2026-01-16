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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`py-6 px-4 md:px-10 ${
        isConnie 
          ? "glass-strong border-l-4 border-blue-400" 
          : "bg-transparent"
      }`}
    >
      <div className="flex items-start space-x-4 max-w-4xl mx-auto">
        <div className={`flex-shrink-0 ${
          isConnie 
            ? "w-10 h-10 bg-gradient-to-br from-blue-500 to-navy-800 rounded-full flex items-center justify-center shadow-glow" 
            : "w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
        }`}>
          {isConnie ? (
            <span className="text-xl">🤖</span>
          ) : (
            <img 
              src={message.user.avatar} 
              alt={message.user.name} 
              className="w-full h-full rounded-full object-cover" 
            />
          )}
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`font-semibold text-sm ${
              isConnie ? "text-blue-300" : "text-gray-300"
            }`}>
              {isConnie ? "Connie" : message.user.name}
            </span>
            {isConnie && (
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                EHS Specialist
              </span>
            )}
          </div>
          <div className={`prose prose-invert max-w-none ${
            isConnie ? "text-gray-200" : "text-gray-300"
          }`}>
            <ReactMarkdown className="text-sm sm:text-base leading-relaxed">
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Message;