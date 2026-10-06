export const APP_TIMEZONE = "America/Costa_Rica";

export type Period = { year: number; month: number };

/** Mes/año de una fecha según la zona horaria del negocio (no UTC). */
export function periodOf(date: Date = new Date()): Period {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month") };
}

export function isClosedPeriod(p: Period, now: Date = new Date()): boolean {
  const cur = periodOf(now);
  return p.year * 12 + p.month < cur.year * 12 + cur.month;
}
