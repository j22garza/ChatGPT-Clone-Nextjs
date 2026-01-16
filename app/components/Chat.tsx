"use client";

import { collection, orderBy, query } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useCollection } from "react-firebase-hooks/firestore";

import Message from "./Message";
import { firestore } from "../firebase/firebase";
import HomeContent from "./HomeContent";

type Props = {
  chatId: string;
};

function Chat({ chatId }: Props) {
  const { data: session } = useSession();
  const messageEndRef = useRef<null | HTMLDivElement>(null);

  const [messages] = useCollection(
    session &&
      query(
        collection(
          firestore,
          `users/${session?.user?.email!}/chats/${chatId}/messages`
        ),
        orderBy("createdAt", "asc")
      )
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 custom-scrollbar">
      {messages?.empty && (
        <div className="min-h-full flex items-center justify-center">
          <HomeContent/>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {messages?.docs.map((message) => (
          <Message key={message.id} message={message.data()} />
        ))}
      </div>
      <div ref={messageEndRef} />
    </div>
  );
}

export default Chat;