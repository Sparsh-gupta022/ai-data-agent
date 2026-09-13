"use client";

import { useEffect, useState } from "react";
import { Plus, MessageSquare, Sparkles } from "lucide-react";
import { Conversation, AgentMode } from "@/lib/types";
import { listConversations } from "@/lib/historyStore";
import { EXAMPLE_PROMPTS } from "@/lib/examplePrompts";

export function Sidebar({
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onExamplePrompt,
}: {
  activeConversationId: string;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onExamplePrompt: (text: string, mode: AgentMode) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(listConversations());
  }, [activeConversationId]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-nav text-nav-text">
      <div className="flex items-center gap-2 px-5 pb-1 pt-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-accent">
          <Sparkles size={15} />
        </div>
        <div>
          <p className="font-display text-[15px] font-semibold text-white">DataAgent</p>
          <p className="text-[11px] text-nav-text/70">AI-powered data analysis &amp; automation</p>
        </div>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-md border border-nav-border px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-nav-raised"
        >
          <Plus size={14} />
          New conversation
        </button>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto scrollbar-thin px-3">
        <p className="px-2 text-[11px] font-medium text-nav-text/50">History</p>
        <div className="mt-1.5 space-y-0.5">
          {conversations.length === 0 && (
            <p className="px-2 py-2 text-[13px] text-nav-text/50">
              Conversations will appear here.
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectConversation(c)}
              className={
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors " +
                (c.id === activeConversationId
                  ? "bg-nav-raised text-white"
                  : "text-nav-text hover:bg-nav-raised/60")
              }
            >
              <MessageSquare size={13} className="shrink-0 opacity-60" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 px-2 text-[11px] font-medium text-nav-text/50">Try asking</p>
        <div className="mt-1.5 space-y-1 pb-4">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p.text}
              type="button"
              onClick={() => onExamplePrompt(p.text, p.mode)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] leading-snug text-nav-text/80 transition-colors hover:bg-nav-raised/60 hover:text-white"
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
