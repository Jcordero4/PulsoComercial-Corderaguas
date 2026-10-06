import Link from "next/link";
import { prisma } from "@/lib/db";
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
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="py-2">Fecha</th>
            {isManager && <th>Vendedor</th>}
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.id} className="border-t align-top">
              <td className="whitespace-nowrap py-2">{formatDateTime(a.createdAt)}</td>
              {isManager && <td>{a.seller.name}</td>}
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
              <td colSpan={6} className="py-4 text-slate-500">
                Sin actividades todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
