import { prisma } from "./db";
import {
  buildTotals,
  expectedPace,
  progressOf,
  statusOf,
  type GroupRow,
  type Status,
} from "./indicators";
import { INDICATORS, type ActivityTypeValue, type IndicatorValue } from "./labels";
import type { Period } from "./period";

export type IndicatorRow = {
  indicator: IndicatorValue;
  actual: number;
  target: number | null;
  ratio: number | null;
  shortfall: number | null;
  status: Status;
};

export type SellerMetrics = {
  seller: { id: string; name: string };
  rows: IndicatorRow[];
};

const num = (v: { toString(): string } | null | undefined) => (v == null ? 0 : Number(v.toString()));

/**
 * Métricas del mes por vendedor. `sellerIds` limita el alcance: el llamador es quien decide
 * qué vendedores puede ver el usuario (un vendedor pasa solo su propio id).
 */
export async function loadMetrics(
  sellers: { id: string; name: string }[],
  period: Period,
  now: Date = new Date(),
): Promise<SellerMetrics[]> {
  if (sellers.length === 0) return [];
  const ids = sellers.map((s) => s.id);
  const where = { sellerId: { in: ids }, periodYear: period.year, periodMonth: period.month };

  const [acts, adjs, goals] = await Promise.all([
    prisma.activity.groupBy({
      by: ["sellerId", "type"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.adjustment.groupBy({
      by: ["sellerId", "type"],
      where,
      _sum: { deltaCount: true, deltaAmount: true },
    }),
    prisma.goal.findMany({
      where: { sellerId: { in: ids }, year: period.year, month: period.month },
    }),
  ]);

  const pace = expectedPace(period, now);
  return sellers.map((seller) => {
    const activities: GroupRow[] = acts
      .filter((a) => a.sellerId === seller.id)
      .map((a) => ({ type: a.type as ActivityTypeValue, count: a._count._all, amount: num(a._sum.amount) }));
    const adjustments: GroupRow[] = adjs
      .filter((a) => a.sellerId === seller.id)
      .map((a) => ({
        type: a.type as ActivityTypeValue,
        count: a._sum.deltaCount ?? 0,
        amount: num(a._sum.deltaAmount),
      }));
    const totals = buildTotals(activities, adjustments);
    const rows = INDICATORS.map((indicator): IndicatorRow => {
      const goal = goals.find((g) => g.sellerId === seller.id && g.indicator === indicator);
      const target = goal ? num(goal.target) : null;
      const actual = totals[indicator];
      const { ratio, shortfall } = progressOf(actual, target);
      return { indicator, actual, target, ratio, shortfall, status: statusOf(actual, target, pace) };
    });
    return { seller, rows };
  });
}

/** Totales del equipo por indicador: suma de avances y de metas (solo de quienes tienen meta). */
export function teamRows(all: SellerMetrics[], period: Period, now: Date = new Date()): IndicatorRow[] {
  const pace = expectedPace(period, now);
  return INDICATORS.map((indicator): IndicatorRow => {
    const rows = all.map((m) => m.rows.find((r) => r.indicator === indicator)!);
    const actual = Math.round(rows.reduce((s, r) => s + r.actual, 0) * 100) / 100;
    const withGoal = rows.filter((r) => r.target !== null);
    const target = withGoal.length ? withGoal.reduce((s, r) => s + (r.target ?? 0), 0) : null;
    // Para el equipo se compara solo el avance de quienes tienen meta contra esa meta.
    const actualWithGoal = withGoal.reduce((s, r) => s + r.actual, 0);
    const { ratio, shortfall } = progressOf(actualWithGoal, target);
    return { indicator, actual, target, ratio, shortfall, status: statusOf(actualWithGoal, target, pace) };
  });
}
