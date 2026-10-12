import { describe, expect, it } from "vitest";
import { describeChange } from "./auditFormat";

const names = { v1: "Vendedor 1", g1: "Gerente 1" };

describe("describeChange", () => {
  it("anulación de venta incluye tipo, monto, vendedor y motivo", () => {
    const r = describeChange("Activity", "ANULAR", "a1", { type: "VENTA", amount: 150000 }, { anulada: true, vendedorId: "v1", motivo: "Duplicada" }, names);
    expect(r.summary).toContain("Venta");
    expect(r.summary).toContain("Vendedor 1");
    expect(r.reason).toBe("Duplicada");
  });
  it("corrección muestra antes → después", () => {
    const r = describeChange("Activity", "CORREGIR", "a1", { type: "LLAMADA", amount: null }, { type: "VISITA", amount: null, vendedorId: "v1", motivo: "Era visita" }, names);
    expect(r.summary).toBe("Llamada → Visita (Vendedor 1)");
  });
  it("meta editada muestra el valor anterior", () => {
    const g = { sellerId: "v1", year: 2026, month: 10, indicator: "LLAMADAS" };
    const r = describeChange("Goal", "EDITAR", "x", { ...g, target: 40 }, { ...g, target: 55 }, names);
    expect(r.summary).toContain("Vendedor 1");
    expect(r.summary).toContain("Llamadas: 55");
    expect(r.summary).toContain("antes: 40");
  });
  it("usuario: resuelve el nombre por id", () => {
    expect(describeChange("User", "DESACTIVAR", "v1", null, null, names).summary).toBe("Vendedor 1");
  });
});
