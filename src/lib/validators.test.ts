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

import { goalSchema, passwordSchema, userSchema } from "./validators";

describe("goalSchema", () => {
  const base = { sellerId: "s1", year: "2026", month: "10" };
  it("meta de conteo debe ser entera", () => {
    expect(goalSchema.safeParse({ ...base, indicator: "LLAMADAS", target: "40" }).success).toBe(true);
    expect(goalSchema.safeParse({ ...base, indicator: "LLAMADAS", target: "40.5" }).success).toBe(false);
  });
  it("meta de monto admite decimales", () => {
    expect(goalSchema.safeParse({ ...base, indicator: "VENTAS_MONTO", target: "1500000,50" }).success).toBe(true);
  });
  it("rechaza cero, mes inválido e indicador desconocido", () => {
    expect(goalSchema.safeParse({ ...base, indicator: "LLAMADAS", target: "0" }).success).toBe(false);
    expect(goalSchema.safeParse({ ...base, month: "13", indicator: "LLAMADAS", target: "5" }).success).toBe(false);
    expect(goalSchema.safeParse({ ...base, indicator: "X", target: "5" }).success).toBe(false);
  });
});

describe("userSchema / passwordSchema", () => {
  it("contraseña mínima de 10", () => {
    expect(passwordSchema.safeParse("corta").success).toBe(false);
    expect(passwordSchema.safeParse("suficientemente").success).toBe(true);
  });
  it("normaliza correo y valida rol", () => {
    const r = userSchema.parse({ name: "Ana", email: " ANA@X.com ", role: "VENDEDOR", password: "una-clave-larga" });
    expect(r.email).toBe("ana@x.com");
    expect(userSchema.safeParse({ name: "A", email: "a@x.com", role: "ADMIN", password: "una-clave-larga" }).success).toBe(false);
  });
});
