"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartSeries = { key: string; name: string; color: string };
/** Una fila por indicador: `pct` por serie y `detail` ("avance / meta") para el tooltip. */
export type ChartDatum = {
  indicator: string;
  pct: Record<string, number>;
  detail: Record<string, string>;
};

type TipProps = {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; payload: { _d: ChartDatum } }[];
};

function Tip({
  active,
  label,
  payload,
  series,
}: TipProps & { series: ChartSeries[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload._d;
  return (
    <div className="rounded border border-[var(--grid)] bg-[var(--surface-1)] p-2 text-xs shadow">
      <div className="mb-1 font-medium text-[var(--ink-1)]">{label}</div>
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-2 text-[var(--ink-2)]">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
          {series.length > 1 && <span>{s.name}:</span>}
          <span className="tabular-nums">
            {Math.round(d.pct[s.key] ?? 0)}% ({d.detail[s.key]})
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProgressChart({
  data,
  series,
  title,
}: {
  data: ChartDatum[];
  series: ChartSeries[];
  title: string;
}) {
  const rows = data.map((d) => ({ name: d.indicator, _d: d, ...d.pct }));
  const max = Math.max(100, ...data.flatMap((d) => Object.values(d.pct)));
  const step = max > 200 ? 100 : 25;
  const top = Math.ceil((max * 1.1) / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  return (
    <figure className="space-y-2" aria-label={title}>
      <figcaption className="font-medium">{title}</figcaption>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 16, right: 48, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--axis)" tick={{ fill: "var(--ink-3)", fontSize: 12 }} tickLine={false} interval={0} />
            <YAxis
              domain={[0, top]}
              ticks={ticks}
              tickFormatter={(v) => `${v}%`}
              stroke="var(--axis)"
              tick={{ fill: "var(--ink-3)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <ReferenceLine
              y={100}
              stroke="var(--ink-3)"
              strokeWidth={1}
              label={{ value: "Meta", position: "right", fill: "var(--ink-3)", fontSize: 12 }}
            />
            <Tooltip content={<Tip series={series} />} cursor={{ fill: "rgba(11,11,11,0.05)" }} />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ink-2)]">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[var(--ink-3)]">
        Avance sobre la meta del mes. La línea marca el 100%. La tabla de abajo tiene los valores exactos.
      </p>
    </figure>
  );
}
