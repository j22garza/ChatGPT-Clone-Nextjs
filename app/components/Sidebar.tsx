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
        <div className={`p-3 flex flex-col h-screen glass-strong border-r border-white/10 ${open ? 'w-72 transition-w ease-in duration-2000 overflow-hidden' : 'w-0 transition-w ease-in duration-2000'}`}>
          <div className="mb-4 px-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-navy-800 rounded-lg flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">Conexus</h2>
                <p className="text-xs text-gray-400">Connie IA</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-scroll">
              <NewChat session={session} toggleSidebar={toggleSidebar} />
              <p className="text-gray-400 mt-4 ml-4 pb-0 text-sm font-medium">Conversaciones Anteriores</p>
              <div className="flex flex-col space-y-2 my-2">
                {loading && (
                  <div className="animate-pulse text-center text-gray-400 py-4">
                    <p>Cargando conversaciones...</p>
                  </div>
                )}
                {chats?.docs.map((chat) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    key={chat.id}
                  >
                    <ChatRow id={chat.id} session={session} />
                  </motion.div>
                ))}
              </div>
          </div>
          {session && (
            <div className="border-t border-gray-400 py-3">
              <div className="chatRow items-center justify-start gap-5">
                <img
                  src={session?.user?.image!}
                  alt={session?.user?.name!}
                  className="h-8 w-8 rounded-sm cursor-pointer hover:opacity-50"
                />
                <p>{session?.user?.name}</p>
              </div>
              <div
                className="chatRow items-center justify-start gap-5"
                onClick={() => signOut()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                <p>Cerrar Sesión</p>
              </div>
            </div>
          )}
        </div>
      )
    }
  </>
  );
}

export default Sidebar;