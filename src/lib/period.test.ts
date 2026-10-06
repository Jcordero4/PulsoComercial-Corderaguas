import { describe, expect, it } from "vitest";
import { isClosedPeriod, periodOf } from "./period";

describe("periodOf", () => {
  it("usa hora de Costa Rica, no UTC", () => {
    // 1 nov 02:00 UTC = 31 oct 20:00 en Costa Rica
    expect(periodOf(new Date("2026-11-01T02:00:00Z"))).toEqual({ year: 2026, month: 10 });
  });
  it("cambia de mes a medianoche local", () => {
    expect(periodOf(new Date("2026-11-01T06:00:00Z"))).toEqual({ year: 2026, month: 11 });
  });
});

describe("isClosedPeriod", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  it("mes anterior está cerrado", () => {
    expect(isClosedPeriod({ year: 2026, month: 9 }, now)).toBe(true);
    expect(isClosedPeriod({ year: 2025, month: 12 }, now)).toBe(true);
  });
  it("mes actual no está cerrado", () => {
    expect(isClosedPeriod({ year: 2026, month: 10 }, now)).toBe(false);
  });
});
