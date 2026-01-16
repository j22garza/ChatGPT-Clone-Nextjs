"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import useSWR from "swr";

import { firestore } from "../firebase/firebase";

type Props = {
  chatId: string;
};

function ChatInput({ chatId }: Props) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [loading, setIsLoading] = useState(false); // false = listo para enviar, true = procesando

  const { data: model } = useSWR("model", {
    fallbackData: "gpt-4o-mini",
  });

  const generateResponse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session) {
      toast.error("Por favor inicia sesión");
      return;
    }

    const input = prompt.trim();
    if (!input) {
      toast.error("Por favor escribe un mensaje");
      return;
    }
    
    setPrompt("");
    setIsLoading(true);

    const notification = toast.loading("Connie está analizando...");

    try {
      // Guardar mensaje del usuario primero
      const message: Message = {
        text: input,
        createdAt: serverTimestamp(),
        user: {
          name: session.user?.name!,
          email: session.user?.email!,
          avatar:
            session.user?.image ||
            `https://ui-avatars.com/api/?name=${session.user?.name!}`,
        },
      };

      await addDoc(
        collection(
          firestore,
          `users/${session.user?.email!}/chats/${chatId}/messages`
        ),
        message
      );

      console.log("[ChatInput] User message saved, calling API...");

      // Llamar a la API
      const response = await fetch("/api/askQuestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          chatId,
          model: model || "gpt-4o-mini",
          session,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.answer || `Error ${response.status}: ${response.statusText}`);
      }

      // Esperar un momento para que Firebase se actualice y muestre la respuesta
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("Connie ha respondido!", {
        id: notification,
      });

      setIsLoading(false);
      
    } catch (error: any) {
      console.error("[ChatInput] Error:", error);
      toast.error(error.message || "Error al procesar tu mensaje. Intenta de nuevo.", {
        id: notification,
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-navy-950 via-navy-950/95 to-transparent pt-8 pb-4">
      <div className="max-w-3xl mx-auto px-4">
        <form 
          onSubmit={generateResponse} 
          className="relative flex items-end gap-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/20 p-2 hover:border-white/30 transition-all duration-200"
        >
          <div className="flex-1 min-w-0">
            <textarea
              rows={1}
              placeholder="Escribe tu mensaje aquí..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              disabled={!session || loading}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && session && !loading) {
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }
              }}
              className="w-full bg-transparent text-white placeholder-gray-500 
                       resize-none focus:outline-none disabled:cursor-not-allowed
                       text-base leading-6 py-3 px-4 max-h-[200px] overflow-y-auto
                       scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              style={{ minHeight: '24px' }}
            />
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || !session || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl 
                     bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                     disabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center
                     transition-all duration-200 ease-out
                     shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                     active:scale-95"
            title={loading ? "Connie está pensando..." : "Enviar mensaje"}
          >
            {!loading ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-white animate-spin"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            )}
          </button>
        </form>
        
        {/* Helper text */}
        <p className="text-xs text-gray-600 text-center mt-2 px-4">
          Connie puede cometer errores. Verifica información importante.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;