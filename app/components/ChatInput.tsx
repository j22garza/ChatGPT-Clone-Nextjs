"use client";

import { useSession } from "next-auth/react";
import React, { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import { useChat } from "../context/ChatContext";
import { getContextualSuggestions } from "../utils/contextualSuggestions";

type Props = { chatId: string };

function ChatInput({ chatId }: Props) {
  const { data: session } = useSession();
  const { getMessages, addMessage, addChatToList } = useChat();
  const [prompt, setPrompt] = useState("");
  const [loading, setIsLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const { data: model } = useSWR("model", { fallbackData: "gpt-4o-mini" });
  const messages = chatId ? getMessages(chatId) : [];
  const suggestionChips = getContextualSuggestions(messages);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!session?.user?.email) {
        toast.error("Por favor inicia sesión");
        return;
      }
      const text = input.trim();
      if (!text) {
        toast.error("Por favor escribe un mensaje");
        return;
      }

      setIsLoading(true);
      const notification = toast.loading("Connie está analizando...");

      const userMessage = {
        text,
        createdAt: Date.now(),
        user: {
          name: session.user?.name ?? "Usuario",
          email: session.user?.email ?? "",
          avatar: session.user?.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name ?? "U")}`,
        },
      };
      const prevMessages = getMessages(chatId);
      const history = prevMessages.map((m) => ({
        role: (m.user.name === "Connie" ? "assistant" : "user") as "user" | "assistant",
        content: m.text,
      }));

      addMessage(chatId, userMessage);
      addChatToList(session.user.email, chatId, text.slice(0, 50) + (text.length > 50 ? "…" : ""));

      try {
        const response = await fetch("/api/askQuestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            chatId,
            model: model || "gpt-4o-mini",
            session,
            history,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.answer || `Error ${response.status}`);

        if (typeof data.stepIndex === "number") setStepIndex(data.stepIndex);

        addMessage(chatId, {
          text: data.answer,
          createdAt: Date.now(),
          user: {
            name: "Connie",
            email: "connie@conexus.ai",
            avatar: "https://ui-avatars.com/api/?name=Connie&background=1e3a8a&color=fff&bold=true",
          },
        });

        toast.success("Connie ha respondido!", { id: notification });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al procesar tu mensaje.";
        toast.error(message, { id: notification, duration: 5000 });
      } finally {
        setIsLoading(false);
      }
    },
    [session, chatId, addMessage, addChatToList, getMessages, model]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = prompt.trim();
    if (!text) return;
    setPrompt("");
    sendMessage(text);
  };

  const handleChipClick = (chipText: string) => {
    sendMessage(chipText);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-navy-950 via-navy-950/95 to-transparent pt-8 pb-4">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6">
        {stepIndex != null && (
          <p className="text-xs text-gray-500 mb-2 px-1">
            Progreso: Paso {stepIndex}/8
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestionChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              disabled={!session || loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/20 p-2 hover:border-white/30 transition-all duration-200"
        >
          <div className="flex-1 min-w-0">
            <textarea
              rows={1}
              placeholder="Escribe tu mensaje aquí..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`;
              }}
              disabled={!session || loading}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && session && !loading) {
                    e.currentTarget.closest("form")?.requestSubmit();
                  }
                }
              }}
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-inset rounded-lg disabled:cursor-not-allowed text-base leading-6 py-3 px-4 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              style={{ minHeight: "24px" }}
            />
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || !session || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 ease-out shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
            title={loading ? "Connie está pensando..." : "Enviar mensaje"}
          >
            {!loading ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white animate-spin">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-600 text-center mt-2 px-4">
          Connie puede cometer errores. Verifica información importante.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
