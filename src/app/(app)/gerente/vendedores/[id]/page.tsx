import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricsTable } from "@/components/MetricsTable";
import { PeriodPicker, parsePeriod } from "@/components/PeriodPicker";
import { ProgressChart } from "@/components/ProgressChart";
import { singleChart } from "@/lib/chartData";
import { prisma } from "@/lib/db";
import {
  ACTIVITY_LABELS,
  MONTH_NAMES,
  formatColones,
  formatDateTime,
  type ActivityTypeValue,
} from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { loadMetrics } from "@/lib/stats";

export default async function DetalleVendedor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireUser("GERENTE");
  const { id } = await params;
  const period = parsePeriod(await searchParams);
  const seller = await prisma.user.findFirst({
    where: { id, role: "VENDEDOR" },
    select: { id: true, name: true, email: true, active: true },
  });
  if (!seller) notFound();

  const [[metrics], activities] = await Promise.all([
    loadMetrics([seller], period),
    prisma.activity.findMany({
      where: { sellerId: id, periodYear: period.year, periodMonth: period.month },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const chart = singleChart(metrics.rows, seller.name);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/gerente?year=${period.year}&month=${period.month}`} className="text-sm underline">
            ← Panel del equipo
          </Link>
          <h1 className="text-2xl font-semibold">{seller.name}</h1>
          <p className="text-sm text-[var(--ink-2)]">
            {MONTH_NAMES[period.month - 1]} {period.year}
            {!seller.active && " · usuario inactivo"}
          </p>
        </div>
        <PeriodPicker period={period} />
      </div>

      {chart.data.length > 0 && (
        <ProgressChart data={chart.data} series={chart.series} title="Avance sobre la meta del mes" />
      )}
      <MetricsTable rows={metrics.rows} caption="Indicadores del mes" />

      <section className="space-y-2">
        <h2 className="font-medium">Actividades del mes ({activities.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--ink-3)]">
              <tr>
                <th className="py-2">Fecha</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-t border-[var(--grid)] align-top">
                  <td className="whitespace-nowrap py-2">{formatDateTime(a.createdAt)}</td>
                  <td>{ACTIVITY_LABELS[a.type as ActivityTypeValue]}</td>
                  <td>
                    {a.client.name} · {a.client.company}
                  </td>
                  <td>{a.amount != null ? formatColones(a.amount) : "—"}</td>
                  <td>{a.note}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-[var(--ink-3)]">
                    Sin actividades registradas en este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
