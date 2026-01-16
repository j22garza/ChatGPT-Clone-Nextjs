"use client";

import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import React from "react";
import { firestore } from "../firebase/firebase";

type Props = {
  session: Session | null;
  toggleSidebar: () => void;
};

function NewChat({ session, toggleSidebar }: Props) {
  const router = useRouter();

  const createNewChat = async () => {
    try {
      if (!session) return;

      const doc = await addDoc(
        collection(firestore, `users/${session.user?.email}/chats`),
        {
          userId: session?.user?.email,
          userEmail: session?.user?.email,
          createdAt: serverTimestamp() as Timestamp,
        }
      );

      if (!doc.id) return;

      router.push(`/chat/${doc.id}`);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className="px-2 mb-3">
      <button
        onClick={createNewChat}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                 transition-all duration-150 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-gray-400 group-hover:text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Nueva conversación</span>
      </button>
    </div>
  );
}

export default NewChat;