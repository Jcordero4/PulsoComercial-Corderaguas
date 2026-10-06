import { describe, expect, it } from "vitest";
import { activitySchema, clientSchema, parseAmount } from "./validators";

describe("parseAmount", () => {
  it("normaliza formatos", () => {
    expect(parseAmount("1500")).toBe("1500");
    expect(parseAmount("1 500,50")).toBe("1500.50");
    expect(parseAmount("₡2500.5")).toBe("2500.5");
  });
  it("rechaza inválidos", () => {
    for (const v of ["", "0", "-5", "abc", "10.999", undefined]) expect(parseAmount(v)).toBeNull();
  });
});

describe("activitySchema", () => {
  it("venta requiere monto", () => {
    expect(activitySchema.safeParse({ type: "VENTA", clientId: "c1" }).success).toBe(false);
    expect(activitySchema.safeParse({ type: "VENTA", clientId: "c1", amount: "5000" }).success).toBe(true);
  });
  it("actividad que no es venta no admite monto", () => {
    expect(activitySchema.safeParse({ type: "LLAMADA", clientId: "c1", amount: "100" }).success).toBe(false);
    expect(activitySchema.safeParse({ type: "LLAMADA", clientId: "c1", amount: "" }).success).toBe(true);
  });
  it("tipo desconocido falla", () => {
    expect(activitySchema.safeParse({ type: "OTRO", clientId: "c1" }).success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("requiere nombre y empresa", () => {
    expect(clientSchema.safeParse({ name: " ", company: "X" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "Ana", company: "X" }).success).toBe(true);
  });
});
