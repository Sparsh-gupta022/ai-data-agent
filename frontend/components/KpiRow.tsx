export function KpiRow({
  columns,
  row,
}: {
  columns: string[];
  row: unknown[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {columns.map((col, i) => (
        <div key={col} className="rounded-lg border border-line bg-panel px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            {col.replace(/_/g, " ")}
          </p>
          <p className="mt-1 font-mono text-lg font-medium text-ink">
            {row[i] === null || row[i] === undefined ? "—" : String(row[i])}
          </p>
        </div>
      ))}
    </div>
  );
}
