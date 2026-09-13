import { Database, Workflow, Sparkles } from "lucide-react";
import { EXAMPLE_PROMPTS } from "@/lib/examplePrompts";
import { AgentMode } from "@/lib/types";

export function EmptyState({
  onExampleClick,
}: {
  onExampleClick: (text: string, mode: AgentMode) => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Sparkles size={20} />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">
        Ask a question, or run a pipeline
      </h1>
      <p className="mt-2 max-w-md text-[14.5px] text-ink-soft">
        DataAgent answers questions over your database with generated, safety-checked SQL, and can
        extract, clean, and load data from external APIs.
      </p>

      <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.slice(0, 6).map((p) => (
          <button
            key={p.text}
            type="button"
            onClick={() => onExampleClick(p.text, p.mode)}
            className="group flex items-start gap-2.5 rounded-lg border border-line bg-panel px-3.5 py-3 text-left text-[13px] leading-snug text-ink-soft transition-colors hover:border-accent/40 hover:bg-accent-soft/40 hover:text-ink"
          >
            {p.mode === "sql" ? (
              <Database size={14} className="mt-0.5 shrink-0 text-ink-faint group-hover:text-accent" />
            ) : (
              <Workflow size={14} className="mt-0.5 shrink-0 text-ink-faint group-hover:text-accent" />
            )}
            {p.text}
          </button>
        ))}
      </div>
    </div>
  );
}
