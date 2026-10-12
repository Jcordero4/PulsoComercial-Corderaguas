import type { ChartDatum, ChartSeries } from "@/components/ProgressChart";
import { INDICATOR_SHORT, formatTarget } from "./labels";
import type { IndicatorRow, SellerMetrics } from "./stats";

// Categórica en orden fijo: el color sigue a la entidad (posición estable en la lista ordenada).
export const SERIES_COLORS = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);
export const MAX_SERIES = SERIES_COLORS.length;

/** Solo se grafican indicadores que tengan meta (sin meta no hay progreso que mostrar). */
function build(
  entries: { key: string; name: string; color: string; rows: IndicatorRow[] }[],
): { data: ChartDatum[]; series: ChartSeries[] } {
  const series = entries.map(({ key, name, color }) => ({ key, name, color }));
  const indicators = entries[0]?.rows.map((r) => r.indicator) ?? [];
  const data: ChartDatum[] = [];
  for (const ind of indicators) {
    const cells = entries.map((e) => ({ key: e.key, row: e.rows.find((r) => r.indicator === ind)! }));
    if (cells.every((c) => c.row.ratio === null)) continue;
    data.push({
      indicator: INDICATOR_SHORT[ind],
      pct: Object.fromEntries(cells.map((c) => [c.key, (c.row.ratio ?? 0) * 100])),
      detail: Object.fromEntries(
        cells.map((c) => [
          c.key,
          c.row.target === null
            ? "sin meta"
            : `${formatTarget(ind, c.row.actual)} / ${formatTarget(ind, c.row.target)}`,
        ]),
      ),
    });
  }
  return { data, series };
}

/** Un vendedor por serie; con más de 8 vendedores se grafica solo el total del equipo. */
export function sellersChart(metrics: SellerMetrics[], team: IndicatorRow[]) {
  if (metrics.length > MAX_SERIES) {
    return build([{ key: "team", name: "Equipo", color: SERIES_COLORS[0], rows: team }]);
  }
  return build(
    metrics.map((m, i) => ({ key: m.seller.id, name: m.seller.name, color: SERIES_COLORS[i], rows: m.rows })),
  );
}

export function singleChart(rows: IndicatorRow[], name: string) {
  return build([{ key: "one", name, color: SERIES_COLORS[0], rows }]);
}
