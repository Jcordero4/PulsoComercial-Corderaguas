import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { loadEffectiveStates } from "@/lib/effectiveStates";
import {
  ACTIVITY_LABELS,
  MONTH_NAMES,
  formatColones,
  formatDateTime,
  type ActivityTypeValue,
} from "@/lib/labels";
import { isClosedPeriod, periodOf } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { CorrectForm, VoidForm } from "./AdjustForms";

export default async function AjustarPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("GERENTE");
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { client: true, seller: true },
  });
  if (!activity) notFound();

  const [adjustments, states] = await Promise.all([
    prisma.adjustment.findMany({
      where: { activityId: id },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
    }),
    loadEffectiveStates([activity]),
  ]);
  const eff = states.get(id)!;
  const now = periodOf();
  const original = { year: activity.periodYear, month: activity.periodMonth };
  const closed = isClosedPeriod(original);

  return (
    <main className="space-y-8">
      <div>
        <Link href="/actividades" className="text-sm underline">
          ← Actividades
        </Link>
        <h1 className="text-2xl font-semibold">Corregir o anular registro</h1>
      </div>

      <section className="space-y-1 text-sm">
        <p>
          <strong>{ACTIVITY_LABELS[activity.type as ActivityTypeValue]}</strong> de {activity.seller.name} con{" "}
          {activity.client.name} · {activity.client.company}
        </p>
        <p className="text-slate-600">
          Registrado el {formatDateTime(activity.createdAt)}
          {activity.amount != null && ` · ${formatColones(activity.amount)}`}
          {activity.note && ` · “${activity.note}”`}
        </p>
        <p>
          Estado actual:{" "}
          {eff.voided ? (
            <strong>Anulado</strong>
          ) : (
            <strong>
              {ACTIVITY_LABELS[eff.type]}
              {eff.amount != null && ` · ${formatColones(eff.amount)}`}
              {eff.corrected && " (corregido)"}
            </strong>
          )}
        </p>
        <p className="rounded bg-amber-50 p-2 text-amber-900">
          El ajuste se contabilizará en <strong>{MONTH_NAMES[now.month - 1]} {now.year}</strong>
          {closed && (
            <>
              {" "}
              (el registro es de {MONTH_NAMES[original.month - 1]} {original.year}, un periodo cerrado que no
              cambia)
            </>
          )}
          . Queda en el historial con tu nombre y la fecha.
        </p>
      </section>

      {eff.voided ? (
        <p className="text-sm text-slate-600">Este registro ya está anulado y no admite más cambios.</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="font-medium">Corregir</h2>
            <CorrectForm
              activityId={id}
              current={{ type: eff.type, amount: eff.amount }}
            />
          </section>
          <section className="space-y-2">
            <h2 className="font-medium">Anular</h2>
            <VoidForm activityId={id} />
          </section>
        </>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Cambios de este registro</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Fecha</th>
              <th>Quién</th>
              <th>Acción</th>
              <th>Efecto</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t align-top">
                <td className="whitespace-nowrap py-2">{formatDateTime(a.createdAt)}</td>
                <td>{a.actor.name}</td>
                <td>{a.kind === "ANULACION" ? "Anulación" : "Corrección"}</td>
                <td>
                  {ACTIVITY_LABELS[a.type as ActivityTypeValue]}: {a.deltaCount > 0 ? "+" : ""}
                  {a.deltaCount}
                  {Number(a.deltaAmount) !== 0 && ` · ${Number(a.deltaAmount) > 0 ? "+" : ""}${formatColones(a.deltaAmount)}`}
                </td>
                <td>{a.reason}</td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  Este registro no tiene cambios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
