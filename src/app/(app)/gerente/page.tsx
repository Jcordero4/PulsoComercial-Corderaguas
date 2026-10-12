import Link from "next/link";
import { MetricsTable } from "@/components/MetricsTable";
import { PeriodPicker, parsePeriod } from "@/components/PeriodPicker";
import { ProgressChart } from "@/components/ProgressChart";
import { StatTile } from "@/components/StatTile";
import { sellersChart } from "@/lib/chartData";
import { prisma } from "@/lib/db";
import { INDICATORS, MONTH_NAMES } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { loadMetrics, teamRows, type SellerMetrics } from "@/lib/stats";

const COUNT_INDICATORS: readonly string[] = INDICATORS.filter((i) => i !== "VENTAS_MONTO");

function summarize(m: SellerMetrics) {
  const withGoal = m.rows.filter((r) => r.target !== null);
  const count = (s: string) => withGoal.filter((r) => r.status === s).length;
  const avg = withGoal.length
    ? withGoal.reduce((s, r) => s + Math.min(r.ratio ?? 0, 1), 0) / withGoal.length
    : null;
  const registros = m.rows.filter((r) => COUNT_INDICATORS.includes(r.indicator)).reduce((s, r) => s + r.actual, 0);
  return {
    metas: withGoal.length,
    alcanzadas: count("ALCANZADA"),
    alDia: count("AL_DIA"),
    porDebajo: count("POR_DEBAJO"),
    avg,
    registros,
  };
}

export default async function GerentePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireUser("GERENTE");
  const period = parsePeriod(await searchParams);
  const sellers = await prisma.user.findMany({
    where: { role: "VENDEDOR", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const metrics = await loadMetrics(sellers, period);
  const team = teamRows(metrics, period);
  const summaries = metrics.map((m) => ({ m, s: summarize(m) }));
  const totals = summaries.reduce(
    (t, { s }) => ({
      metas: t.metas + s.metas,
      alcanzadas: t.alcanzadas + s.alcanzadas,
      alDia: t.alDia + s.alDia,
      porDebajo: t.porDebajo + s.porDebajo,
    }),
    { metas: 0, alcanzadas: 0, alDia: 0, porDebajo: 0 },
  );
  const chart = sellersChart(metrics, team);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Panel del equipo</h1>
          <p className="text-sm text-[var(--ink-2)]">
            {MONTH_NAMES[period.month - 1]} {period.year}
          </p>
        </div>
        <PeriodPicker period={period} />
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Metas definidas" value={totals.metas} hint={`${sellers.length} vendedores activos`} />
        <StatTile label="Metas alcanzadas" value={totals.alcanzadas} />
        <StatTile label="Al día" value={totals.alDia} hint="Avance igual o mayor al ritmo del mes" />
        <StatTile label="Por debajo" value={totals.porDebajo} hint="Avance menor al ritmo del mes" />
      </section>

      {chart.data.length > 0 ? (
        <ProgressChart data={chart.data} series={chart.series} title="Avance por indicador y vendedor" />
      ) : (
        <p className="rounded border border-[var(--grid)] p-4 text-sm text-[var(--ink-2)]">
          Aún no hay metas para este mes.{" "}
          <Link className="underline" href={`/metas?year=${period.year}&month=${period.month}`}>
            Definir metas
          </Link>
        </p>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Vendedores</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--ink-3)]">
              <tr>
                <th className="py-2">Vendedor</th>
                <th>Registros del mes</th>
                <th>Metas</th>
                <th>Alcanzadas</th>
                <th>Al día</th>
                <th>Por debajo</th>
                <th>Avance promedio</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(({ m, s }) => (
                <tr key={m.seller.id} className="border-t border-[var(--grid)]">
                  <td className="py-2">
                    <Link
                      className="underline"
                      href={`/gerente/vendedores/${m.seller.id}?year=${period.year}&month=${period.month}`}
                    >
                      {m.seller.name}
                    </Link>
                  </td>
                  <td className="tabular-nums">{s.registros}</td>
                  <td className="tabular-nums">{s.metas}</td>
                  <td className="tabular-nums">{s.alcanzadas}</td>
                  <td className="tabular-nums">{s.alDia}</td>
                  <td className="tabular-nums">{s.porDebajo}</td>
                  <td className="tabular-nums">{s.avg === null ? "—" : `${Math.round(s.avg * 100)}%`}</td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-[var(--ink-3)]">
                    No hay vendedores activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-1">
        <MetricsTable rows={team} caption="Resumen del equipo por indicador" />
        <p className="text-xs text-[var(--ink-3)]">
          El avance es el total del equipo. El progreso y el estado comparan solo a quienes tienen meta definida.
        </p>
      </section>
    </main>
  );
}
