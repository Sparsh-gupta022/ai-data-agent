"use client";

import { useEffect, useRef } from "react";
import { ChatMessage, AgentMode } from "@/lib/types";
import { MessageUser } from "./MessageUser";
import { MessageAssistant } from "./MessageAssistant";
import { EmptyState } from "./EmptyState";

export function ChatThread({
  messages,
  onExampleClick,
}: {
  messages: ChatMessage[];
  onExampleClick: (text: string, mode: AgentMode) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.status, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <EmptyState onExampleClick={onExampleClick} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        {messages.map((m) =>
          m.role === "user" ? (
            <MessageUser key={m.id} message={m} />
          ) : (
            <MessageAssistant key={m.id} message={m} />
          )
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
