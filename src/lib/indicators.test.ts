import { describe, expect, it } from "vitest";
import { buildTotals, expectedPace, progressOf, statusOf } from "./indicators";

describe("buildTotals", () => {
  it("cada actividad suma solo a su indicador", () => {
    const t = buildTotals(
      [
        { type: "LLAMADA", count: 3, amount: 0 },
        { type: "VISITA", count: 1, amount: 0 },
      ],
      [],
    );
    expect(t.LLAMADAS).toBe(3);
    expect(t.VISITAS).toBe(1);
    expect(t.REUNIONES).toBe(0);
    expect(t.VENTAS_CANTIDAD).toBe(0);
    expect(t.VENTAS_MONTO).toBe(0);
  });
  it("una venta suma cantidad y monto", () => {
    const t = buildTotals([{ type: "VENTA", count: 2, amount: 150000.5 }], []);
    expect(t.VENTAS_CANTIDAD).toBe(2);
    expect(t.VENTAS_MONTO).toBe(150000.5);
  });
  it("los ajustes del mes (negativos) restan cantidad y monto", () => {
    const t = buildTotals(
      [{ type: "VENTA", count: 3, amount: 300000 }],
      [{ type: "VENTA", count: -1, amount: -100000 }],
    );
    expect(t.VENTAS_CANTIDAD).toBe(2);
    expect(t.VENTAS_MONTO).toBe(200000);
  });
  it("redondea el monto a 2 decimales", () => {
    const t = buildTotals([{ type: "VENTA", count: 3, amount: 0.1 + 0.2 }], []);
    expect(t.VENTAS_MONTO).toBe(0.3);
  });
});

describe("progressOf", () => {
  it("progreso = avance / meta; faltante = meta - avance", () => {
    expect(progressOf(30, 40)).toEqual({ ratio: 0.75, shortfall: 10 });
  });
  it("si alcanza o supera la meta, faltante cero", () => {
    expect(progressOf(40, 40).shortfall).toBe(0);
    expect(progressOf(55, 40)).toEqual({ ratio: 1.375, shortfall: 0 });
  });
  it("sin meta no hay progreso", () => {
    expect(progressOf(5, null)).toEqual({ ratio: null, shortfall: null });
  });
});

describe("expectedPace", () => {
  it("mes pasado completo, mes futuro cero", () => {
    const now = new Date("2026-10-15T18:00:00Z");
    expect(expectedPace({ year: 2026, month: 9 }, now)).toBe(1);
    expect(expectedPace({ year: 2026, month: 11 }, now)).toBe(0);
  });
  it("mes actual = día / días del mes, en hora de Costa Rica", () => {
    // 15 oct 12:00 CR → 15/31
    expect(expectedPace({ year: 2026, month: 10 }, new Date("2026-10-15T18:00:00Z"))).toBeCloseTo(15 / 31);
    // 1 nov 02:00 UTC = 31 oct 20:00 CR → día 31
    expect(expectedPace({ year: 2026, month: 10 }, new Date("2026-11-01T02:00:00Z"))).toBe(1);
  });
});

describe("statusOf", () => {
  it("clasifica contra meta y ritmo esperado", () => {
    expect(statusOf(40, 40, 0.5)).toBe("ALCANZADA");
    expect(statusOf(25, 40, 0.5)).toBe("AL_DIA");
    expect(statusOf(10, 40, 0.5)).toBe("POR_DEBAJO");
    expect(statusOf(10, null, 0.5)).toBe("SIN_META");
  });
});
