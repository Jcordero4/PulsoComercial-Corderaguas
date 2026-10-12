import { INDICATOR_LABELS, formatTarget } from "@/lib/labels";
import type { IndicatorRow } from "@/lib/stats";
import { Meter, StatusBadge } from "./StatusBadge";

/** Vista en tabla de los indicadores: es también la alternativa accesible a la gráfica. */
export function MetricsTable({ rows, caption }: { rows: IndicatorRow[]; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm [&_td]:pr-4 [&_th]:pr-4">
        {caption && <caption className="pb-2 text-left font-medium">{caption}</caption>}
        <thead className="text-left text-[var(--ink-3)]">
          <tr>
            <th className="py-2">Indicador</th>
            <th>Avance</th>
            <th>Meta</th>
            <th>Progreso</th>
            <th>Faltante</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.indicator} className="border-t border-[var(--grid)]">
              <td className="py-2">{INDICATOR_LABELS[r.indicator]}</td>
              <td className="tabular-nums">{formatTarget(r.indicator, r.actual)}</td>
              <td className="tabular-nums">{r.target === null ? "—" : formatTarget(r.indicator, r.target)}</td>
              <td>
                <Meter ratio={r.ratio} status={r.status} />
              </td>
              <td className="tabular-nums">
                {r.status === "SIN_META"
                  ? "—"
                  : r.status === "ALCANZADA"
                    ? "Meta alcanzada"
                    : formatTarget(r.indicator, r.shortfall ?? 0)}
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
