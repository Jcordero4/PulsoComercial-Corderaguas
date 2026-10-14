import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cronAuth";

const secret = "un-secreto-largo-de-prueba-123";

describe("isCronAuthorized", () => {
  it("acepta solo 'Bearer <secreto>' exacto", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });
  it("rechaza sin cabecera, con secreto distinto o sin prefijo Bearer", () => {
    expect(isCronAuthorized(null, secret)).toBe(false);
    expect(isCronAuthorized(undefined, secret)).toBe(false);
    expect(isCronAuthorized("Bearer otro-secreto-de-igual-largo!!", secret)).toBe(false);
    expect(isCronAuthorized(secret, secret)).toBe(false);
    expect(isCronAuthorized(`bearer ${secret}`, secret)).toBe(false);
    expect(isCronAuthorized(`Bearer ${secret} `, secret)).toBe(false);
  });
  it("sin CRON_SECRET (o demasiado corto) nunca autoriza, aunque coincida", () => {
    expect(isCronAuthorized("Bearer ", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer corto", "corto")).toBe(false);
  });
});
