import Link from "next/link";
import { MetricsTable } from "@/components/MetricsTable";
import { PeriodPicker, parsePeriod } from "@/components/PeriodPicker";
import { ProgressChart } from "@/components/ProgressChart";
import { StatTile } from "@/components/StatTile";
import { singleChart } from "@/lib/chartData";
import { MONTH_NAMES, formatColones } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { loadMetrics } from "@/lib/stats";

export default async function VendedorPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireUser("VENDEDOR");
  const period = parsePeriod(await searchParams);
  // Solo se consultan las métricas del propio vendedor.
  const [metrics] = await loadMetrics([{ id: user.id, name: user.name }], period);
  const row = (i: string) => metrics.rows.find((r) => r.indicator === i)!;
  const chart = singleChart(metrics.rows, user.name);
  const withGoal = metrics.rows.filter((r) => r.target !== null);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mi avance</h1>
          <p className="text-sm text-[var(--ink-2)]">
            {MONTH_NAMES[period.month - 1]} {period.year}
          </p>
        </div>
        <PeriodPicker period={period} />
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Ventas del mes" value={row("VENTAS_CANTIDAD").actual} />
        <StatTile label="Monto vendido" value={formatColones(row("VENTAS_MONTO").actual)} />
        <StatTile
          label="Metas alcanzadas"
          value={`${withGoal.filter((r) => r.status === "ALCANZADA").length} de ${withGoal.length}`}
        />
        <StatTile
          label="Por debajo del ritmo"
          value={withGoal.filter((r) => r.status === "POR_DEBAJO").length}
          hint="Indicadores con avance menor al esperado hoy"
        />
      </section>

      {chart.data.length > 0 ? (
        <ProgressChart data={chart.data} series={chart.series} title="Mi avance sobre la meta del mes" />
      ) : (
        <p className="rounded border border-[var(--grid)] p-4 text-sm text-[var(--ink-2)]">
          Gerencia aún no ha definido tus metas para este mes.
        </p>
      )}
      <MetricsTable rows={metrics.rows} caption="Mis indicadores" />
      <Link href="/actividades/nueva" className="inline-block rounded bg-slate-900 px-4 py-2 text-white">
        Registrar actividad
      </Link>
    </main>
  );
}
