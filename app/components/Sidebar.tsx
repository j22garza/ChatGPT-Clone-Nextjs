"use client";

import { collection, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useCollection } from "react-firebase-hooks/firestore";

import ChatRow from "./ChatRow";
import NewChat from "./NewChat";
import { firestore } from "../firebase/firebase";
import React,{useState} from "react";

type Props = {};

function Sidebar({}: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(true);

  const [chats, loading] = useCollection(
    session &&
      query(
        collection(firestore, `users/${session?.user?.email!}/chats`),
        orderBy("createdAt", "asc")
      )
  );

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <>
    {
      open===false ? 
      (
        <div onClick={() => toggleSidebar()} className="flex fixed max-w-[50px] sm:min-w-[50px] sm:ml-2 p-2 glass sm:justify-center items-center hover:glass-strong sm:py-3 sm:mx-6 sm:my-4 border-white/20 border rounded-lg cursor-pointer z-50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
      ) :
      (
        <div className={`p-2 flex flex-col h-screen bg-navy-900/50 backdrop-blur-xl border-r border-white/10 ${open ? 'w-64 transition-all duration-300 overflow-hidden' : 'w-0 transition-all duration-300'}`}>
          {/* Header */}
          <div className="mb-3 px-3 py-2">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h2 className="text-sm font-semibold text-white truncate">Conexus</h2>
                <p className="text-xs text-gray-500 truncate">Connie IA</p>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-4 h-4 text-gray-400 group-hover:text-gray-300 flex-shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <NewChat session={session} toggleSidebar={toggleSidebar} />
              {chats && chats.docs.length > 0 && (
                <div className="px-3 mt-4 mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Historial
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-1 px-2">
                {loading && (
                  <div className="animate-pulse text-center text-gray-500 py-6 text-xs">
                    Cargando...
                  </div>
                )}
                {chats?.docs.map((chat) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    key={chat.id}
                  >
                    <ChatRow id={chat.id} session={session} />
                  </motion.div>
                ))}
              </div>
          </div>
          {session && (
            <div className="border-t border-white/10 pt-3 pb-2 px-2 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                <img
                  src={session?.user?.image!}
                  alt={session?.user?.name!}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg 
                         hover:bg-red-500/10 text-gray-400 hover:text-red-400
                         transition-colors text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      )
    }
  </>
  );
}

export default Sidebar;