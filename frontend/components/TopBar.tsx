"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import { HealthResponse } from "@/lib/types";

export function TopBar() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const result = await getHealth();
        if (!cancelled) setHealth(result);
      } catch {
        if (!cancelled) setHealth(null);
      } finally {
        if (!cancelled) setChecked(true);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const connected = checked && health?.status === "ok";
  const degraded = checked && health?.status === "degraded";

  const label = !checked
    ? "Checking backend…"
    : connected
    ? "Connected"
    : degraded
    ? "Degraded"
    : "Backend unreachable";

  const dotClass = !checked
    ? "bg-ink-faint"
    : connected
    ? "bg-accent"
    : degraded
    ? "bg-warn"
    : "bg-danger";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-5">
      <div className="lg:hidden">
        <p className="font-display text-sm font-semibold text-ink">DataAgent</p>
      </div>
      <div className="hidden lg:block" />
      <div
        className="flex items-center gap-2 text-[13px] text-ink-soft"
        title={health?.details ?? undefined}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {label}
      </div>
    </header>
  );
}
