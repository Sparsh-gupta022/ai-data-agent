"use client";

import { AgentMode } from "@/lib/types";
import { Database, Workflow, Sparkles } from "lucide-react";

const MODES: { value: AgentMode; label: string; icon: React.ElementType }[] = [
  { value: "auto", label: "Auto", icon: Sparkles },
  { value: "sql", label: "SQL Analysis", icon: Database },
  { value: "etl", label: "ETL Pipeline", icon: Workflow },
];

export function ModeSelector({
  value,
  onChange,
}: {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors " +
              (active
                ? "bg-accent text-white"
                : "text-ink-soft hover:bg-canvas hover:text-ink")
            }
          >
            <Icon size={13} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
