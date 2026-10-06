import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ClientForm } from "./ClientForm";
import { createClient } from "./actions";

export default async function ClientesPage() {
  const user = await requireUser();
  const clients = await prisma.client.findMany({ orderBy: [{ company: "asc" }, { name: "asc" }] });
  const isManager = user.role === "GERENTE";
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <section className="space-y-2">
        <h2 className="font-medium">Nuevo cliente</h2>
        <ClientForm action={createClient} submitLabel="Agregar" />
      </section>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="py-2">Nombre</th>
            <th>Empresa</th>
            {isManager && <th />}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="py-2">{c.name}</td>
              <td>{c.company}</td>
              {isManager && (
                <td className="text-right">
                  <Link className="underline" href={`/clientes/${c.id}/editar`}>
                    Editar
                  </Link>
                </td>
              )}
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-slate-500">
                Aún no hay clientes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
