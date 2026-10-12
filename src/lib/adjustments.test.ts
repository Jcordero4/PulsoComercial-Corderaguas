import { describe, expect, it } from "vitest";
import { buildTotals } from "./indicators";
import { effectiveState, planCorrection, planVoid, type EffectiveState } from "./adjustments";

const venta = (amount: number): EffectiveState => ({ type: "VENTA", amount, voided: false, corrected: false });
const llamada: EffectiveState = { type: "LLAMADA", amount: null, voided: false, corrected: false };

describe("planVoid", () => {
  it("anular una venta resta cantidad y monto", () => {
    const p = planVoid(venta(150000));
    expect(p).toMatchObject({ ok: true, rows: [{ type: "VENTA", deltaCount: -1, deltaAmount: -150000 }] });
  });
  it("anular una llamada resta 1 sin monto", () => {
    expect(planVoid(llamada)).toMatchObject({ ok: true, rows: [{ type: "LLAMADA", deltaCount: -1, deltaAmount: 0 }] });
  });
  it("no se anula dos veces", () => {
    expect(planVoid({ ...llamada, voided: true }).ok).toBe(false);
  });
});

describe("planCorrection", () => {
  it("corregir el monto de una venta no cambia la cantidad", () => {
    const p = planCorrection(venta(100000), { type: "VENTA", amount: 120000.5 });
    expect(p).toMatchObject({ ok: true, rows: [{ type: "VENTA", deltaCount: 0, deltaAmount: 20000.5 }] });
  });
  it("sin cambios se rechaza", () => {
    expect(planCorrection(venta(100000), { type: "VENTA", amount: 100000 }).ok).toBe(false);
    expect(planCorrection(llamada, { type: "LLAMADA", amount: null }).ok).toBe(false);
  });
  it("cambiar de tipo mueve 1 de un indicador al otro", () => {
    const p = planCorrection(llamada, { type: "VISITA", amount: null });
    expect(p).toMatchObject({
      ok: true,
      rows: [
        { type: "LLAMADA", deltaCount: -1, deltaAmount: 0 },
        { type: "VISITA", deltaCount: 1, deltaAmount: 0 },
      ],
    });
  });
  it("de venta a otro tipo quita cantidad y monto de ventas", () => {
    const p = planCorrection(venta(90000), { type: "COTIZACION", amount: null });
    expect(p).toMatchObject({
      ok: true,
      rows: [
        { type: "VENTA", deltaCount: -1, deltaAmount: -90000 },
        { type: "COTIZACION", deltaCount: 1, deltaAmount: 0 },
      ],
      afterAmount: null,
    });
  });
  it("de otro tipo a venta exige monto y lo suma", () => {
    expect(planCorrection(llamada, { type: "VENTA", amount: null }).ok).toBe(false);
    expect(planCorrection(llamada, { type: "VENTA", amount: 50000 })).toMatchObject({
      ok: true,
      rows: [
        { type: "LLAMADA", deltaCount: -1, deltaAmount: 0 },
        { type: "VENTA", deltaCount: 1, deltaAmount: 50000 },
      ],
    });
  });
  it("registro anulado no se corrige", () => {
    expect(planCorrection({ ...venta(1), voided: true }, { type: "VENTA", amount: 5 }).ok).toBe(false);
  });
});

describe("effectiveState", () => {
  const t = (s: string) => new Date(s);
  it("aplica ajustes en orden cronológico", () => {
    const s = effectiveState({ type: "LLAMADA", amount: null }, [
      { kind: "CORRECCION", afterType: "VENTA", afterAmount: 5000, createdAt: t("2026-10-02") },
      { kind: "CORRECCION", afterType: "VENTA", afterAmount: 7000, createdAt: t("2026-10-03") },
    ]);
    expect(s).toMatchObject({ type: "VENTA", amount: 7000, voided: false, corrected: true });
  });
  it("una anulación marca el registro como anulado", () => {
    const s = effectiveState({ type: "VENTA", amount: 100 }, [
      { kind: "ANULACION", afterType: "VENTA", afterAmount: 100, createdAt: t("2026-10-02") },
    ]);
    expect(s.voided).toBe(true);
  });
});

describe("integración con el avance del mes", () => {
  it("venta de periodo cerrado anulada hoy: el ajuste cae en el mes actual", () => {
    // Septiembre (cerrado): 2 ventas por 300000. Octubre: solo el ajuste de la anulación.
    const septiembre = buildTotals([{ type: "VENTA", count: 2, amount: 300000 }], []);
    const plan = planVoid(venta(100000));
    if (!plan.ok) throw new Error("plan");
    const octubre = buildTotals([], plan.rows.map((r) => ({ type: r.type, count: r.deltaCount, amount: r.deltaAmount })));
    expect(septiembre.VENTAS_CANTIDAD).toBe(2); // septiembre no cambia
    expect(septiembre.VENTAS_MONTO).toBe(300000);
    expect(octubre.VENTAS_CANTIDAD).toBe(-1);
    expect(octubre.VENTAS_MONTO).toBe(-100000);
  });
});
