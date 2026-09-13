import { ChatResponse } from "@/lib/types";
import { getDownloadUrl } from "@/lib/api";
import { CheckCircle2, Download, XCircle } from "lucide-react";

function hostnameOf(url?: string | null): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}


export function EtlResultPanel({ response }: { response: ChatResponse }) {
  const { metadata } = response;
  const succeeded = response.success;

  const steps = [
    {
      title: "Extract",
      detail: metadata.source_api
        ? `Retrieved ${metadata.records_extracted ?? "—"} records from ${metadata.source_api}`
        : "Source API data retrieved",
    },
    {
      title: "Transform",
      detail:
        metadata.records_after_cleaning !== undefined && metadata.records_after_cleaning !== null
          ? `Cleaned to ${metadata.records_after_cleaning} rows (deduped, normalized columns)`
          : "Data cleaned",
    },
    {
      title: "Load",
      detail: metadata.download_url ? "CSV file generated" : "No output file was produced",
    },
  ];

  return (
    <div className="space-y-3">
      <ol className="space-y-2.5 rounded-lg border border-line bg-panel px-4 py-3.5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-2.5 text-sm">
            {succeeded || i < 2 ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
            ) : (
              <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />
            )}
            <div>
              <p className="font-medium text-ink">{step.title}</p>
              <p className="text-ink-soft">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Source" value={hostnameOf(metadata.source_api)} />
        <Stat label="Records processed" value={String(metadata.records_after_cleaning ?? metadata.records_extracted ?? "—")} />
        <Stat label="Execution time" value={response.execution_time ? `${response.execution_time.toFixed(2)}s` : "—"} />
        <Stat label="Status" value={succeeded ? "Success" : "Failed"} tone={succeeded ? "ok" : "danger"} />
      </div>

      {response.error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          {response.error === "internal_error"
            ? "The pipeline failed unexpectedly. See the answer above for details."
            : response.error}
        </div>
      )}

      {metadata.download_url && (
        <a
          href={getDownloadUrl(metadata.download_url)}
          download
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Download size={14} />
          Download CSV
        </a>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "danger";
}) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p
        className={
          "mt-1 truncate font-mono text-sm font-medium " +
          (tone === "ok" ? "text-accent" : tone === "danger" ? "text-danger" : "text-ink")
        }
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
