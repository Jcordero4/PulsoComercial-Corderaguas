import { prisma } from "./db";
import { effectiveState, type AdjustmentLike, type EffectiveState } from "./adjustments";
import type { ActivityTypeValue } from "./labels";

const num = (v: { toString(): string } | null | undefined) => (v == null ? null : Number(v.toString()));

/** Estado vigente (tras correcciones y anulaciones) de varias actividades en una sola consulta. */
export async function loadEffectiveStates(
  activities: { id: string; type: string; amount: { toString(): string } | null }[],
): Promise<Map<string, EffectiveState>> {
  const ids = activities.map((a) => a.id);
  const adjs = ids.length
    ? await prisma.adjustment.findMany({
        where: { activityId: { in: ids } },
        select: { activityId: true, kind: true, afterType: true, afterAmount: true, createdAt: true },
      })
    : [];
  // Las filas de una misma acción comparten estado final: basta con tratarlas como una lista.
  const byActivity = new Map<string, AdjustmentLike[]>();
  for (const a of adjs) {
    const list = byActivity.get(a.activityId) ?? [];
    list.push({
      kind: a.kind as AdjustmentLike["kind"],
      afterType: a.afterType as ActivityTypeValue | null,
      afterAmount: num(a.afterAmount),
      createdAt: a.createdAt,
    });
    byActivity.set(a.activityId, list);
  }
  return new Map(
    activities.map((a) => [
      a.id,
      effectiveState(
        { type: a.type as ActivityTypeValue, amount: num(a.amount) },
        byActivity.get(a.id) ?? [],
      ),
    ]),
  );
}
