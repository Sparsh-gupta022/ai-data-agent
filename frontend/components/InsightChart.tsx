"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function InsightChart({
  labelKey,
  valueKey,
  data,
}: {
  labelKey: string;
  valueKey: string;
  data: Record<string, unknown>[];
}) {
  return (
    <div className="h-56 w-full px-1 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EA" vertical={false} />
          <XAxis
            dataKey={labelKey}
            tick={{ fontSize: 11, fill: "#8A93A3" }}
            tickLine={false}
            axisLine={{ stroke: "#E4E6EA" }}
            interval={0}
            angle={data.length > 5 ? -20 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
            height={data.length > 5 ? 48 : 24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8A93A3" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "rgba(31, 122, 108, 0.06)" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E4E6EA",
              fontSize: 12,
              fontFamily: "var(--font-body)",
            }}
          />
          <Bar dataKey={valueKey} fill="#1F7A6C" radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Decide whether a chart genuinely helps this result, and shape the data for
 * it if so. Only fires for a label column + a single numeric column, with a
 * row count that's actually legible as a chart (2-15 rows). Otherwise the
 * table alone is the right presentation.
 */
export function buildChartSpec(
  columns: string[],
  rows: unknown[][]
): { labelKey: string; valueKey: string; data: Record<string, unknown>[] } | null {
  if (rows.length < 2 || rows.length > 15 || columns.length < 2) return null;

  const isNumericColumn = (colIndex: number) =>
    rows.every((row) => {
      const v = row[colIndex];
      return v !== null && v !== undefined && !isNaN(Number(v));
    });

  const numericIdx: number[] = [];
  const labelIdx: number[] = [];
  columns.forEach((_, i) => {
    if (isNumericColumn(i)) numericIdx.push(i);
    else labelIdx.push(i);
  });

  if (numericIdx.length !== 1 || labelIdx.length < 1) return null;

  const labelColumnIndex = labelIdx[0];
  const valueColumnIndex = numericIdx[0];

  const data = rows.map((row) => ({
    [columns[labelColumnIndex]]: row[labelColumnIndex],
    [columns[valueColumnIndex]]: Number(row[valueColumnIndex]),
  }));

  return {
    labelKey: columns[labelColumnIndex],
    valueKey: columns[valueColumnIndex],
    data,
  };
}
