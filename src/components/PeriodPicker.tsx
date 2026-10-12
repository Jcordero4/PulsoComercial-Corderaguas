import { MONTH_NAMES } from "@/lib/labels";
import { periodOf, type Period } from "@/lib/period";

/** Lee mes/año de la URL; sin valores usa el mes actual (hora de Costa Rica). */
export function parsePeriod(sp: { year?: string; month?: string }): Period {
  const cur = periodOf();
  return {
    year: Math.min(2100, Math.max(2024, Number(sp.year) || cur.year)),
    month: Math.min(12, Math.max(1, Number(sp.month) || cur.month)),
  };
}

export function PeriodPicker({ period }: { period: Period }) {
  const field = "mt-1 block rounded border border-slate-300 px-3 py-2";
  return (
    <form method="get" className="flex items-end gap-3 text-sm">
      <label>
        Mes
        <select name="month" defaultValue={period.month} className={field}>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        Año
        <input name="year" type="number" min={2024} max={2100} defaultValue={period.year} className={`${field} w-24`} />
      </label>
      <button className="rounded border border-slate-300 px-3 py-2">Ver</button>
    </form>
  );
}
