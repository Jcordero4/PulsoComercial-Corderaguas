import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ClientForm } from "../../ClientForm";
import { updateClient } from "../../actions";

export default async function EditarCliente({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("GERENTE");
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar cliente</h1>
      <ClientForm
        action={updateClient.bind(null, id)}
        initial={client}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
