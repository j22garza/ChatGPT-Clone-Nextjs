"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useChat } from "../context/ChatContext";

const suggestions = [
  { title: "Identificar riesgos", description: "Analiza los riesgos industriales y ambientales de mi empresa", prompt: "Necesito identificar los riesgos industriales y ambientales de mi empresa. ¿Puedes ayudarme a hacer un análisis de riesgo básico?" },
  { title: "Normativas NOM", description: "Consulta sobre cumplimiento de normativas NOM y OSHA", prompt: "¿Qué normativas NOM debo cumplir para seguridad industrial en mi sector?" },
  { title: "Proveedores EHS", description: "Encuentra proveedores verificados de equipos de seguridad", prompt: "Necesito proveedores de equipos de protección personal (EPP) verificados. ¿Puedes sugerirme al menos 3 opciones?" },
  { title: "Investigación de incidentes", description: "Guía para investigar y documentar incidentes de seguridad", prompt: "Tuve un incidente en mi empresa. ¿Cómo debo investigarlo y documentarlo según las mejores prácticas EHS?" },
  { title: "Análisis de seguridad", description: "Realiza un análisis AST (Análisis de Seguridad del Trabajo)", prompt: "Necesito realizar un Análisis de Seguridad del Trabajo (AST) para una nueva operación. ¿Cómo debo proceder?" },
  { title: "Medio ambiente", description: "Consulta sobre gestión ambiental y cumplimiento normativo", prompt: "¿Qué requisitos ambientales debo cumplir para operaciones industriales en México?" },
];

const HomeContent = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { createChat, addMessage, addChatToList } = useChat();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSuggestionClick = async (prompt: string) => {
    if (!session?.user?.email) return;
    try {
      setLoading(prompt);
      const chatId = createChat(session.user.email);
      const userMessage = {
        text: prompt,
        createdAt: Date.now(),
        user: {
          name: session.user?.name ?? "Usuario",
          email: session.user.email,
          avatar: session.user?.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name ?? "U")}`,
        },
      };
      addMessage(chatId, userMessage);
      addChatToList(session.user.email, chatId, prompt.slice(0, 50) + (prompt.length > 50 ? "…" : ""));

      const res = await fetch("/api/askQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          chatId,
          model: "gpt-4o-mini",
          session,
          history: [{ role: "user" as const, content: prompt }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.answer || "Error al enviar mensaje");
        setLoading(null);
        return;
      }

      addMessage(chatId, {
        text: data.answer,
        createdAt: Date.now(),
        user: {
          name: "Connie",
          email: "connie@conexus.ai",
          avatar: "https://ui-avatars.com/api/?name=Connie&background=1e3a8a&color=fff&bold=true",
        },
      });
      router.push(`/chat/${chatId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear conversación";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16 w-full">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-navy-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-4xl">🤖</span>
          </div>
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-white bg-clip-text text-transparent">Connie</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light mb-8">
          Tu asistente especializado en <span className="text-blue-400 font-medium">Seguridad Industrial</span>
        </p>
        <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
          Analiza riesgos, cumple normativas NOM y OSHA, y conecta con proveedores verificados de seguridad.
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            onClick={() => handleSuggestionClick(suggestion.prompt)}
            disabled={loading === suggestion.prompt || !session}
            className="group relative text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 ease-out hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">{suggestion.title}</h3>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors line-clamp-2">{suggestion.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="text-center">
        <p className="text-xs text-gray-600">Empieza escribiendo tu pregunta o selecciona una sugerencia arriba</p>
      </motion.div>
    </div>
  );
};

export default HomeContent;
