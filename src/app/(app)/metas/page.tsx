import { prisma } from "@/lib/db";
import {
  INDICATOR_LABELS,
  INDICATORS,
  MONTH_NAMES,
  formatTarget,
  type IndicatorValue,
} from "@/lib/labels";
import { periodOf } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { deleteGoal } from "./actions";
import { GoalForm } from "./GoalForm";

type SearchParams = Promise<{ year?: string; month?: string }>;

export default async function MetasPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const isManager = user.role === "GERENTE";
  const sp = await searchParams;
  const cur = periodOf();
  const year = Math.min(2100, Math.max(2024, Number(sp.year) || cur.year));
  const month = Math.min(12, Math.max(1, Number(sp.month) || cur.month));

  // Un vendedor solo ve sus metas; el filtro va en la consulta.
  const goals = await prisma.goal.findMany({
    where: { year, month, ...(isManager ? {} : { sellerId: user.id }) },
    include: { seller: true },
    orderBy: [{ seller: { name: "asc" } }],
  });
  goals.sort(
    (a, b) =>
      a.seller.name.localeCompare(b.seller.name) ||
      INDICATORS.indexOf(a.indicator as IndicatorValue) - INDICATORS.indexOf(b.indicator as IndicatorValue),
  );
  const sellers = isManager
    ? await prisma.user.findMany({
        where: { role: "VENDEDOR", active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];
  const field = "mt-1 block rounded border border-slate-300 px-3 py-2";

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">{isManager ? "Metas mensuales" : "Mis metas"}</h1>

      <form method="get" className="flex items-end gap-3 text-sm">
        <label>
          Mes
          <select name="month" defaultValue={month} className={field}>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          Año
          <input name="year" type="number" min={2024} max={2100} defaultValue={year} className={`${field} w-24`} />
        </label>
        <button className="rounded border border-slate-300 px-3 py-2">Ver</button>
      </form>

      {isManager && (
        <section className="space-y-2">
          <h2 className="font-medium">Definir meta (crea o reemplaza la existente)</h2>
          <GoalForm sellers={sellers} year={year} month={month} />
        </section>
      )}

      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            {isManager && <th className="py-2">Vendedor</th>}
            <th className={isManager ? "" : "py-2"}>Indicador</th>
            <th>Meta</th>
            {isManager && <th />}
          </tr>
        </thead>
        <tbody>
          {goals.map((g) => (
            <tr key={g.id} className="border-t">
              {isManager && <td className="py-2">{g.seller.name}</td>}
              <td className={isManager ? "" : "py-2"}>{INDICATOR_LABELS[g.indicator as IndicatorValue]}</td>
              <td>{formatTarget(g.indicator as IndicatorValue, g.target)}</td>
              {isManager && (
                <td className="text-right">
                  <form action={deleteGoal.bind(null, g.id)}>
                    <button className="text-red-700 underline">Eliminar</button>
                  </form>
                </td>
              )}
            </tr>
          ))}
          {goals.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-slate-500">
                Sin metas para {MONTH_NAMES[month - 1].toLowerCase()} {year}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
