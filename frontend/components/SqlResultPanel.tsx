import { ChatResponse } from "@/lib/types";
import { DataTable } from "./DataTable";
import { KpiRow } from "./KpiRow";
import { InsightChart, buildChartSpec } from "./InsightChart";
import { Collapsible } from "./Collapsible";
import { CopyButton } from "./CopyButton";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function SqlResultPanel({ response }: { response: ChatResponse }) {
  const columns = response.columns ?? [];
  const rows = (response.data as unknown[][]) ?? [];
  const chartSpec = buildChartSpec(columns, rows);
  const isSafe = response.metadata.is_safe_sql;

  return (
    <div className="space-y-3">
      {rows.length === 1 && columns.length > 0 && columns.length <= 6 && (
        <KpiRow columns={columns} row={rows[0]} />
      )}

      {rows.length > 1 && columns.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line">
          <DataTable columns={columns} rows={rows} />
        </div>
      )}

      {chartSpec && (
        <div className="rounded-lg border border-line bg-panel">
          <InsightChart {...chartSpec} />
        </div>
      )}

      {isSafe === "No" && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            The generated query was blocked before running because it wasn&apos;t a
            safe, read-only operation.
            {response.metadata.safety_comments ? ` ${response.metadata.safety_comments}` : ""}
          </span>
        </div>
      )}

      {response.generated_sql && (
        <Collapsible
          label="View generated SQL"
          actions={<CopyButton value={response.generated_sql} label="Copy SQL" />}
        >
          <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-ink">
            {response.generated_sql}
          </pre>
        </Collapsible>
      )}

      {isSafe === "Yes" && (
        <Collapsible label="View execution details">
          <div className="space-y-1.5 px-4 py-3 text-[13px] text-ink-soft">
            <div className="flex items-center gap-1.5 text-accent">
              <ShieldCheck size={14} />
              <span>Passed the read-only safety check before executing.</span>
            </div>
            {response.metadata.safety_comments && (
              <p className="text-ink-faint">{response.metadata.safety_comments}</p>
            )}
            <p>Rows returned: {rows.length}</p>
            {typeof response.execution_time === "number" && (
              <p>Execution time: {response.execution_time.toFixed(2)}s</p>
            )}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
