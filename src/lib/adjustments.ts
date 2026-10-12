import type { ActivityTypeValue } from "./labels";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Estado vigente de una actividad: el original, modificado por sus ajustes en orden. */
export type EffectiveState = {
  type: ActivityTypeValue;
  amount: number | null;
  voided: boolean;
  corrected: boolean;
};

export type AdjustmentLike = {
  kind: "CORRECCION" | "ANULACION";
  afterType: ActivityTypeValue | null;
  afterAmount: number | null;
  createdAt: Date;
};

export function effectiveState(
  original: { type: ActivityTypeValue; amount: number | null },
  adjustments: AdjustmentLike[],
): EffectiveState {
  let state: EffectiveState = { ...original, voided: false, corrected: false };
  const ordered = [...adjustments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const adj of ordered) {
    if (adj.kind === "ANULACION") {
      state = { ...state, voided: true };
    } else {
      state = {
        ...state,
        type: adj.afterType ?? state.type,
        amount: adj.afterAmount,
        corrected: true,
      };
    }
  }
  return state;
}

export type AdjustmentRow = { type: ActivityTypeValue; deltaCount: number; deltaAmount: number };
export type AdjustmentPlan =
  | { ok: true; rows: AdjustmentRow[]; afterType: ActivityTypeValue; afterAmount: number | null }
  | { ok: false; error: string };

const neg = (n: number) => (n === 0 ? 0 : -n); // evita -0
const amountOf = (type: ActivityTypeValue, amount: number | null) => (type === "VENTA" ? (amount ?? 0) : 0);

/** Anular quita 1 al indicador vigente y, si era venta, su monto. */
export function planVoid(eff: EffectiveState): AdjustmentPlan {
  if (eff.voided) return { ok: false, error: "Este registro ya está anulado" };
  return {
    ok: true,
    rows: [{ type: eff.type, deltaCount: -1, deltaAmount: neg(amountOf(eff.type, eff.amount)) }],
    afterType: eff.type,
    afterAmount: eff.amount,
  };
}

/**
 * Corregir tipo y/o monto. Mismo tipo (venta): solo cambia el monto.
 * Otro tipo: -1 en el indicador anterior (y su monto si era venta) y +1 en el nuevo.
 */
export function planCorrection(
  eff: EffectiveState,
  next: { type: ActivityTypeValue; amount: number | null },
): AdjustmentPlan {
  if (eff.voided) return { ok: false, error: "No se puede corregir un registro anulado" };
  if (next.type === "VENTA" && (next.amount === null || next.amount <= 0)) {
    return { ok: false, error: "Una venta requiere un monto mayor a cero" };
  }
  const nextAmount = next.type === "VENTA" ? next.amount : null;

  if (next.type === eff.type) {
    if (eff.type !== "VENTA") return { ok: false, error: "No hay cambios que registrar" };
    const delta = round2((nextAmount ?? 0) - (eff.amount ?? 0));
    if (delta === 0) return { ok: false, error: "No hay cambios que registrar" };
    return {
      ok: true,
      rows: [{ type: "VENTA", deltaCount: 0, deltaAmount: delta }],
      afterType: "VENTA",
      afterAmount: nextAmount,
    };
  }
  return {
    ok: true,
    rows: [
      { type: eff.type, deltaCount: -1, deltaAmount: neg(amountOf(eff.type, eff.amount)) },
      { type: next.type, deltaCount: 1, deltaAmount: amountOf(next.type, nextAmount) },
    ],
    afterType: next.type,
    afterAmount: nextAmount,
  };
}
