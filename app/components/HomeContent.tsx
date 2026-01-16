"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const HomeContent = () => {
  const router = useRouter();

  const suggestions = [
    {
      title: "Identificar riesgos",
      description: "Analiza los riesgos industriales y ambientales de mi empresa",
      prompt: "Necesito identificar los riesgos industriales y ambientales de mi empresa. ¿Puedes ayudarme a hacer un análisis de riesgo básico?"
    },
    {
      title: "Normativas NOM",
      description: "Consulta sobre cumplimiento de normativas NOM y OSHA",
      prompt: "¿Qué normativas NOM debo cumplir para seguridad industrial en mi sector?"
    },
    {
      title: "Proveedores EHS",
      description: "Encuentra proveedores verificados de equipos de seguridad",
      prompt: "Necesito proveedores de equipos de protección personal (EPP) verificados. ¿Puedes sugerirme al menos 3 opciones?"
    },
    {
      title: "Investigación de incidentes",
      description: "Guía para investigar y documentar incidentes de seguridad",
      prompt: "Tuve un incidente en mi empresa. ¿Cómo debo investigarlo y documentarlo según las mejores prácticas EHS?"
    },
    {
      title: "Análisis de seguridad",
      description: "Realiza un análisis AST (Análisis de Seguridad del Trabajo)",
      prompt: "Necesito realizar un Análisis de Seguridad del Trabajo (AST) para una nueva operación. ¿Cómo debo proceder?"
    },
    {
      title: "Medio ambiente",
      description: "Consulta sobre gestión ambiental y cumplimiento normativo",
      prompt: "¿Qué requisitos ambientales debo cumplir para operaciones industriales en México?"
    }
  ];

  const handleSuggestionClick = (prompt: string) => {
    // Create new chat and navigate
    router.push(`/chat/new?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[90vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="mb-6">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-blue-300 to-white bg-clip-text text-transparent text-glow">
            CONNIE IA
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">
            Tu asistente inteligente para <span className="text-blue-400 font-semibold">Seguridad Industrial</span>
          </p>
        </div>
        <div className="glass-strong max-w-3xl mx-auto p-6 rounded-2xl">
          <p className="text-gray-200 leading-relaxed">
            Plataforma de inteligencia artificial que analiza procesos y riesgos laborales según normativas 
            <span className="text-blue-300 font-semibold"> NOM, OSHA</span> e internacionales, generando análisis 
            personalizados y conectando empresas con proveedores de seguridad verificados.
          </p>
        </div>
      </motion.div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={() => handleSuggestionClick(suggestion.prompt)}
            className="glass hover:glass-strong p-5 rounded-xl cursor-pointer 
                     transition-all duration-300 group border border-white/10 hover:border-blue-400/50
                     hover:shadow-glow"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 glass-strong p-6 rounded-2xl max-w-2xl text-center"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-navy-800 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Hola, soy CONNIE IA</h3>
            <p className="text-sm text-gray-400">Tu asistente inteligente para seguridad industrial</p>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">
          Te guiaré paso a paso para identificar riesgos, encontrar soluciones y conectar con proveedores verificados.
          Estoy especializada en EHS y puedo ayudarte con análisis de riesgo, cumplimiento normativo y mucho más.
        </p>
      </motion.div>
    </div>
  )
}

export default HomeContent