export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: unknown[][];
}) {
  if (!columns.length || !rows.length) {
    return (
      <p className="px-4 py-3 text-sm text-ink-faint">
        The query executed successfully but returned no rows.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-ink-soft"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-line last:border-0 hover:bg-canvas/70"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="whitespace-nowrap px-4 py-2 font-mono text-[13px] text-ink"
                >
                  {cell === null || cell === undefined ? (
                    <span className="text-ink-faint">—</span>
                  ) : (
                    String(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
