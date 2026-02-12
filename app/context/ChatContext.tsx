"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface ChatMessageItem {
  text: string;
  createdAt: number;
  user: { name: string; email: string; avatar: string };
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: number;
}

const CHAT_LIST_KEY = (email: string) => `connie_chat_list_${email}`;
const CHAT_MESSAGES_KEY = (chatId: string) => `connie_chat_${chatId}`;

function loadChatList(email: string): ChatListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_LIST_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveChatList(email: string, list: ChatListItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_LIST_KEY(email), JSON.stringify(list));
}

function loadMessages(chatId: string): ChatMessageItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY(chatId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessages(chatId: string, messages: ChatMessageItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_MESSAGES_KEY(chatId), JSON.stringify(messages));
}

interface ChatContextValue {
  chatList: ChatListItem[];
  getMessages: (chatId: string) => ChatMessageItem[];
  ensureMessagesLoaded: (chatId: string) => void;
  addMessage: (chatId: string, message: ChatMessageItem) => void;
  setMessages: (chatId: string, messages: ChatMessageItem[]) => void;
  createChat: (userEmail: string) => string;
  addChatToList: (userEmail: string, chatId: string, title?: string) => void;
  removeChat: (userEmail: string, chatId: string) => void;
  refreshChatList: (userEmail: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [messagesCache, setMessagesCache] = useState<Record<string, ChatMessageItem[]>>({});

  const refreshChatList = useCallback((userEmail: string) => {
    setChatList(loadChatList(userEmail));
  }, []);

  const getMessages = useCallback((chatId: string) => {
    if (messagesCache[chatId] !== undefined) return messagesCache[chatId];
    return [];
  }, [messagesCache]);

  const ensureMessagesLoaded = useCallback((chatId: string) => {
    if (chatId in messagesCache) return;
    setMessagesCache((prev) => ({ ...prev, [chatId]: loadMessages(chatId) }));
  }, [messagesCache]);

  const setMessages = useCallback((chatId: string, messages: ChatMessageItem[]) => {
    saveMessages(chatId, messages);
    setMessagesCache((prev) => ({ ...prev, [chatId]: messages }));
  }, []);

  const addMessage = useCallback((chatId: string, message: ChatMessageItem) => {
    const current = messagesCache[chatId] ?? loadMessages(chatId);
    const next = [...current, message];
    saveMessages(chatId, next);
    setMessagesCache((prev) => ({ ...prev, [chatId]: next }));
  }, [messagesCache]);

  const createChat = useCallback((userEmail: string) => {
    const id = crypto.randomUUID();
    const list = loadChatList(userEmail);
    list.unshift({ id, title: "Nueva conversación", createdAt: Date.now() });
    saveChatList(userEmail, list);
    setChatList(list);
    return id;
  }, []);

  const addChatToList = useCallback((userEmail: string, chatId: string, title = "Nueva conversación") => {
    const list = loadChatList(userEmail);
    const existing = list.find((c) => c.id === chatId);
    if (existing) {
      existing.title = title;
      existing.createdAt = Date.now();
    } else {
      list.unshift({ id: chatId, title, createdAt: Date.now() });
    }
    saveChatList(userEmail, list);
    setChatList([...list]);
  }, []);

  const removeChat = useCallback((userEmail: string, chatId: string) => {
    const list = loadChatList(userEmail).filter((c) => c.id !== chatId);
    saveChatList(userEmail, list);
    setChatList(list);
    if (typeof window !== "undefined") localStorage.removeItem(CHAT_MESSAGES_KEY(chatId));
    setMessagesCache((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      chatList,
      getMessages,
      ensureMessagesLoaded,
      addMessage,
      setMessages,
      createChat,
      addChatToList,
      removeChat,
      refreshChatList,
    }),
    [chatList, getMessages, ensureMessagesLoaded, addMessage, setMessages, createChat, addChatToList, removeChat, refreshChatList]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
