"use client";

import { collection, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { Session } from "next-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { firestore } from "../firebase/firebase";

type Props = {
  id: string;
  session: Session | null;
};

function ChatRow({ id, session }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);

  const [messages] = useCollection(
    query(
      collection(
        firestore,
        `users/${session?.user?.email!}/chats/${id}/messages`
      ),
      orderBy("createdAt", "asc")
    )
  );

  useEffect(() => {
    if (!pathname) return;

    setActive(pathname.includes(id));
  }, [pathname]);

  const removeChat = async () => {
    await deleteDoc(doc(firestore, `users/${session?.user?.email!}/chats/${id}`));
    router.replace("/");
  };

  return (
    <Link
      href={`/chat/${id}`}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                 transition-all duration-150
                 ${active 
                   ? "bg-blue-600/20 border border-blue-500/30" 
                   : "hover:bg-white/5 border border-transparent"
                 }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={`w-4 h-4 flex-shrink-0 ${
          active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400"
        }`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
      <p className={`flex-1 truncate text-sm ${
        active ? "text-white font-medium" : "text-gray-400 group-hover:text-gray-300"
      }`}>
        {messages?.docs[messages?.docs.length - 2]?.data().text || "Nueva conversación"}
      </p>
      {active && (
        <button
          onClick={(e) => {
            e.preventDefault();
            removeChat();
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
          title="Eliminar conversación"
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
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      )}
    </Link>
  );
}

export default ChatRow;