import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActivityForm } from "../ActivityForm";

export default async function NuevaActividad() {
  const user = await requireUser();
  const [clients, sellers] = await Promise.all([
    prisma.client.findMany({ orderBy: [{ company: "asc" }, { name: "asc" }] }),
    user.role === "GERENTE"
      ? prisma.user.findMany({ where: { role: "VENDEDOR", active: true }, orderBy: { name: "asc" } })
      : Promise.resolve(undefined),
  ]);
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Registrar actividad</h1>
      <ActivityForm
        clients={clients.map((c) => ({ id: c.id, label: `${c.name} — ${c.company}` }))}
        sellers={sellers?.map((s) => ({ id: s.id, label: s.name }))}
      />
    </main>
  );
}
