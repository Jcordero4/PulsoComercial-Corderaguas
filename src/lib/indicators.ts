import { periodOf, type Period } from "./period";
import { INDICATORS, type ActivityTypeValue, type IndicatorValue } from "./labels";

// Cada actividad suma 1 solo al indicador de su tipo; la venta además suma su monto.
export const TYPE_TO_INDICATOR: Record<ActivityTypeValue, IndicatorValue> = {
  LLAMADA: "LLAMADAS",
  VISITA: "VISITAS",
  REUNION: "REUNIONES",
  COTIZACION: "COTIZACIONES",
  VENTA: "VENTAS_CANTIDAD",
  SEGUIMIENTO: "SEGUIMIENTOS",
};

export type Totals = Record<IndicatorValue, number>;
/** Conteo y monto agrupados por tipo de actividad (de actividades o de ajustes). */
export type GroupRow = { type: ActivityTypeValue; count: number; amount: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Avance por indicador = actividades del mes + ajustes contabilizados en ese mes. */
export function buildTotals(activities: GroupRow[], adjustments: GroupRow[]): Totals {
  const totals = Object.fromEntries(INDICATORS.map((i) => [i, 0])) as Totals;
  for (const row of [...activities, ...adjustments]) {
    totals[TYPE_TO_INDICATOR[row.type]] += row.count;
    if (row.type === "VENTA") totals.VENTAS_MONTO += row.amount;
  }
  totals.VENTAS_MONTO = round2(totals.VENTAS_MONTO);
  return totals;
}

/** Progreso = avance / meta. Faltante = meta - avance, nunca negativo. */
export function progressOf(actual: number, target: number | null) {
  if (target === null || target <= 0) return { ratio: null, shortfall: null };
  return { ratio: actual / target, shortfall: round2(Math.max(target - actual, 0)) };
}

const dayOfMonthCR = (d: Date) =>
  Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", day: "numeric" })
      .formatToParts(d)
      .find((p) => p.type === "day")!.value,
  );

/** Fracción del mes transcurrida: ritmo esperado. Mes pasado = 1, mes futuro = 0. */
export function expectedPace(period: Period, now: Date = new Date()): number {
  const cur = periodOf(now);
  const a = period.year * 12 + period.month;
  const b = cur.year * 12 + cur.month;
  if (a < b) return 1;
  if (a > b) return 0;
  const daysInMonth = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  return dayOfMonthCR(now) / daysInMonth;
}

export type Status = "ALCANZADA" | "AL_DIA" | "POR_DEBAJO" | "SIN_META";

export function statusOf(actual: number, target: number | null, pace: number): Status {
  if (target === null || target <= 0) return "SIN_META";
  if (actual >= target) return "ALCANZADA";
  return actual / target >= pace ? "AL_DIA" : "POR_DEBAJO";
}
