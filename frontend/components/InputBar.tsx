"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { AgentMode } from "@/lib/types";
import { ModeSelector } from "./ModeSelector";

export function InputBar({
  mode,
  onModeChange,
  onSend,
  onStop,
  isSending,
}: {
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  isSending: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!value.trim() || isSending) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-line bg-panel px-5 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
        <ModeSelector value={mode} onChange={onModeChange} />
        <div className="flex items-end gap-2 rounded-xl border border-line bg-panel px-3 py-2 shadow-subtle focus-within:border-accent">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data, or describe an ETL job to run…"
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {isSending ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-white transition-colors hover:bg-ink/85"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              title="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={15} />
            </button>
          )}
        </div>
        <p className="text-center text-[11px] text-ink-faint">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}
