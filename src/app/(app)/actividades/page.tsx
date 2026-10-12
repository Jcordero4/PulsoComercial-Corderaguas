import Link from "next/link";
import { ActivityState } from "@/components/ActivityState";
import { prisma } from "@/lib/db";
import { loadEffectiveStates } from "@/lib/effectiveStates";
import {
  ACTIVITY_LABELS,
  formatColones,
  formatDateTime,
  type ActivityTypeValue,
} from "@/lib/labels";
import { requireUser } from "@/lib/session";

export default async function ActividadesPage() {
  const user = await requireUser();
  const isManager = user.role === "GERENTE";
  // Un vendedor solo ve lo suyo: el filtro se aplica en la consulta, no en la UI.
  const activities = await prisma.activity.findMany({
    where: isManager ? {} : { sellerId: user.id },
    include: { client: true, seller: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const states = await loadEffectiveStates(activities);
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isManager ? "Actividades del equipo" : "Mis actividades"}
        </h1>
        <Link href="/actividades/nueva" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
          Registrar
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_td]:pr-3 [&_th]:pr-3">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Fecha</th>
              {isManager && <th>Vendedor</th>}
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Nota</th>
              <th>Estado</th>
              {isManager && <th />}
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => {
              const state = states.get(a.id)!;
              return (
                <tr key={a.id} className="border-t align-top">
                  <td className="whitespace-nowrap py-2">{formatDateTime(a.createdAt)}</td>
                  {isManager && <td>{a.seller.name}</td>}
                  <td className={state.voided ? "text-slate-400 line-through" : ""}>
                    {ACTIVITY_LABELS[a.type as ActivityTypeValue]}
                  </td>
                  <td>
                    {a.client.name} · {a.client.company}
                  </td>
                  <td className={state.voided ? "text-slate-400 line-through" : ""}>
                    {a.amount != null ? formatColones(a.amount) : "—"}
                  </td>
                  <td>{a.note}</td>
                  <td>
                    <ActivityState state={state} />
                  </td>
                  {isManager && (
                    <td className="whitespace-nowrap text-right">
                      <Link className="underline" href={`/actividades/${a.id}/ajustar`}>
                        {state.voided ? "Ver cambios" : "Corregir / anular"}
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
            {activities.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-slate-500">
                  Sin actividades todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
