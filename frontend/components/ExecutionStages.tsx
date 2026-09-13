"use client";

import { useEffect, useState } from "react";
import { AgentMode } from "@/lib/types";

const STAGES: Record<AgentMode, string[]> = {
  sql: [
    "Analyzing request",
    "Inspecting database schema",
    "Generating SQL query",
    "Validating query safety",
    "Executing query",
    "Preparing response",
  ],
  etl: [
    "Analyzing request",
    "Planning extraction",
    "Extracting data from API",
    "Transforming & cleaning data",
    "Loading dataset to CSV",
    "Preparing response",
  ],
  auto: [
    "Analyzing request",
    "Selecting the right agent",
    "Running agent",
    "Preparing response",
  ],
};

// There is no real node-by-node progress streaming from the backend today
// (a single request/response call, see backend README limitations), so this
// advances on a timer as an honest stage indicator rather than a fabricated
// percentage. It never claims to be further along than "the last stage
// before the response we don't have yet".
export function ExecutionStages({ mode }: { mode: AgentMode }) {
  const stages = STAGES[mode] ?? STAGES.auto;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const interval = setInterval(() => {
      setIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3.5">
      <ul className="space-y-2">
        {stages.map((stage, i) => {
          const state = i < index ? "done" : i === index ? "active" : "pending";
          return (
            <li key={stage} className="flex items-center gap-2.5 text-sm">
              <span
                className={
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                  (state === "done"
                    ? "border-accent bg-accent"
                    : state === "active"
                    ? "border-accent"
                    : "border-line")
                }
              >
                {state === "done" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-panel" />
                )}
                {state === "active" && (
                  <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-accent" />
                )}
              </span>
              <span
                className={
                  state === "pending" ? "text-ink-faint" : "text-ink-soft"
                }
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
