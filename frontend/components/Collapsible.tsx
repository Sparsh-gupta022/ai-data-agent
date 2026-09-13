"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function Collapsible({
  label,
  defaultOpen = false,
  children,
  actions,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between bg-canvas/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          />
          {label}
        </button>
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </div>
      {open && <div className="border-t border-line bg-panel">{children}</div>}
    </div>
  );
}
