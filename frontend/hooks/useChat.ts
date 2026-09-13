"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage, ApiError } from "@/lib/api";
import { AgentMode, ChatMessage, Conversation } from "@/lib/types";
import { deriveTitle, saveConversation } from "@/lib/historyStore";

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useChat(initial?: Conversation) {
  const [conversation, setConversation] = useState<Conversation>(
    () =>
      initial || {
        id: makeId(),
        title: "New conversation",
        createdAt: Date.now(),
        messages: [],
      }
  );
  const [mode, setMode] = useState<AgentMode>("auto");
  const [isSending, setIsSending] = useState(false);
  const conversationIdRef = useRef(conversation.id);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversation.id;
  }, [conversation.id]);

  const persist = useCallback((next: Conversation) => {
    setConversation(next);
    if (next.messages.length > 0) {
      saveConversation(next);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    persist({
      id: makeId(),
      title: "New conversation",
      createdAt: Date.now(),
      messages: [],
    });
  }, [persist]);

  const loadConversation = useCallback(
    (loaded: Conversation) => {
      persist(loaded);
    },
    [persist]
  );

  const sendMessage = useCallback(
    async (text: string, overrideMode?: AgentMode) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const activeMode = overrideMode || mode;
      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        mode: activeMode,
        content: trimmed,
        status: "done",
        createdAt: Date.now(),
      };
      const pendingMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        mode: activeMode,
        content: "",
        status: "pending",
        createdAt: Date.now(),
      };

      const withPending: Conversation = {
        ...conversation,
        title:
          conversation.messages.length === 0
            ? deriveTitle([userMessage])
            : conversation.title,
        messages: [...conversation.messages, userMessage, pendingMessage],
      };
      setConversation(withPending);
      setIsSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await sendChatMessage(
          trimmed,
          activeMode,
          conversation.messages.length > 0 ? conversationIdRef.current : null,
          controller.signal
        );

        conversationIdRef.current = response.metadata.conversation_id || conversationIdRef.current;

        const finalMessages = withPending.messages.map((m) =>
          m.id === pendingMessage.id
            ? {
                ...m,
                content: response.answer,
                response,
                status: response.success ? ("done" as const) : ("error" as const),
              }
            : m
        );

        persist({
          ...withPending,
          id: conversationIdRef.current,
          messages: finalMessages,
        });
      } catch (err) {
        const wasAborted = err instanceof DOMException && err.name === "AbortError";
        const message = wasAborted
          ? "Stopped. The backend may still finish processing this request, but the wait was cancelled."
          : err instanceof ApiError
          ? err.message
          : "Unexpected error talking to the backend.";
        const finalMessages = withPending.messages.map((m) =>
          m.id === pendingMessage.id
            ? { ...m, content: message, status: "error" as const }
            : m
        );
        persist({ ...withPending, messages: finalMessages });
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [conversation, isSending, mode, persist]
  );

  const stopSending = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    conversation,
    mode,
    setMode,
    isSending,
    sendMessage,
    stopSending,
    startNewConversation,
    loadConversation,
  };
}
