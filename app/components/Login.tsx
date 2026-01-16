"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

type Props = {};

function Login({}: Props) {
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Check for error in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error === "OAuthSignin") {
        setErrorMessage("Error al iniciar sesión con Google. Verifica las credenciales en Vercel.");
      } else if (error) {
        setErrorMessage(`Error: ${error}`);
      }
    }
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Error signing in:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
      
      <div className="relative z-10 max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-navy-800 rounded-2xl flex items-center justify-center shadow-glow animate-float">
            <span className="text-5xl">🤖</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-blue-300 to-white bg-clip-text text-transparent">
            Conexus
          </h1>
          <p className="text-gray-400 text-sm">Inteligencia Artificial para EHS</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-strong p-8 rounded-2xl mb-6"
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Bienvenido a Conexus
          </h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Tu plataforma de inteligencia artificial especializada en Seguridad Industrial, 
            Salud Ocupacional y Medio Ambiente. Conoce a <span className="text-blue-400 font-semibold">Connie</span>, 
            tu asistente virtual EHS.
          </p>
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg backdrop-blur-sm">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          <button
            onClick={handleSignIn}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-400 text-xs"
        >
          <p>Plataforma especializada en EHS</p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;