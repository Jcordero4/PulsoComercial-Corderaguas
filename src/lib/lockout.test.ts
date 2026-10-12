import { describe, expect, it } from "vitest";
import { LOCK_MINUTES, MAX_FAILED_LOGINS, afterFailedLogin, isLocked } from "./lockout";

const now = new Date("2026-10-12T12:00:00Z");

describe("afterFailedLogin", () => {
  it("cuenta intentos sin bloquear antes del máximo", () => {
    expect(afterFailedLogin(0, now)).toEqual({ failedLogins: 1, lockedUntil: null });
    expect(afterFailedLogin(MAX_FAILED_LOGINS - 2, now).lockedUntil).toBeNull();
  });
  it("al llegar al máximo bloquea por el tiempo definido y reinicia el contador", () => {
    const r = afterFailedLogin(MAX_FAILED_LOGINS - 1, now);
    expect(r.failedLogins).toBe(0);
    expect(r.lockedUntil).toEqual(new Date(now.getTime() + LOCK_MINUTES * 60_000));
  });
});

describe("isLocked", () => {
  it("bloqueado solo mientras no venza", () => {
    expect(isLocked(new Date(now.getTime() + 1000), now)).toBe(true);
    expect(isLocked(new Date(now.getTime() - 1000), now)).toBe(false);
    expect(isLocked(null, now)).toBe(false);
  });
});
