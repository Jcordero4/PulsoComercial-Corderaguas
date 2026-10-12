import { prisma } from "@/lib/db";
import { ENTITY_LABELS, actionLabel, describeChange } from "@/lib/auditFormat";
import { formatDateTime } from "@/lib/labels";
import { requireUser } from "@/lib/session";

type Json = Record<string, unknown> | null;

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ entidad?: string }>;
}) {
  await requireUser("GERENTE");
  const { entidad } = await searchParams;
  const filter = entidad && entidad in ENTITY_LABELS ? entidad : undefined;

  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: filter ? { entity: filter } : {},
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);
  const names = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Historial de cambios</h1>
          <p className="text-sm text-slate-600">Quién cambió qué y cuándo. Los últimos 200 movimientos.</p>
        </div>
        <form method="get" className="flex items-end gap-2 text-sm">
          <label>
            Tipo de cambio
            <select
              name="entidad"
              defaultValue={filter ?? ""}
              className="mt-1 block rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Todos</option>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded border border-slate-300 px-3 py-2">Filtrar</button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_td]:pr-3 [&_th]:pr-3">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Fecha</th>
              <th>Quién</th>
              <th>Qué</th>
              <th>Detalle</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const d = describeChange(
                l.entity,
                l.action,
                l.entityId,
                l.before as Json,
                l.after as Json,
                names,
              );
              return (
                <tr key={l.id} className="border-t align-top">
                  <td className="whitespace-nowrap py-2">{formatDateTime(l.createdAt)}</td>
                  <td>{l.actor.name}</td>
                  <td className="whitespace-nowrap">
                    {actionLabel(l.action)} · {ENTITY_LABELS[l.entity] ?? l.entity}
                  </td>
                  <td>{d.summary}</td>
                  <td>{d.reason ?? ""}</td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  Sin cambios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
