"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Bot } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { ExecutionStages } from "./ExecutionStages";
import { SqlResultPanel } from "./SqlResultPanel";
import { EtlResultPanel } from "./EtlResultPanel";

export function MessageAssistant({ message }: { message: ChatMessage }) {
  const response = message.response;
  const effectiveMode =
    response?.mode === "auto" ? response.metadata.routed_mode ?? "auto" : response?.mode ?? message.mode;

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-white">
        <Bot size={13} />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {message.status === "pending" && <ExecutionStages mode={message.mode} />}

        {message.status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{message.content}</span>
          </div>
        )}

        {message.status === "done" && (
          <>
            {response?.mode === "auto" && response.metadata.routed_mode && (
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                Routed to {response.metadata.routed_mode === "sql" ? "SQL analyst" : "ETL analyst"}
              </p>
            )}

            <div className="agent-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>

            {response && effectiveMode === "sql" && <SqlResultPanel response={response} />}
            {response && effectiveMode === "etl" && <EtlResultPanel response={response} />}
          </>
        )}
      </div>
    </div>
  );
}
