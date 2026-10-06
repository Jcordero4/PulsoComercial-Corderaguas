"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { clientSchema } from "@/lib/validators";

export type FormState =
  | { error?: string; fieldErrors?: Record<string, string>; ok?: boolean }
  | undefined;

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

// Cualquier usuario autenticado puede crear clientes (son compartidos).
export async function createClient(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const client = await prisma.client.create({ data: { ...parsed.data, createdById: user.id } });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: "Client",
      entityId: client.id,
      action: "CREAR",
      after: parsed.data,
    },
  });
  revalidatePath("/clientes");
  return { ok: true };
}

// Solo gerencia edita clientes; el cambio queda en el historial.
export async function updateClient(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("GERENTE");
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const before = await prisma.client.findUnique({ where: { id } });
  if (!before) return { error: "Cliente no encontrado" };
  await prisma.client.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: "Client",
      entityId: id,
      action: "EDITAR",
      before: { name: before.name, company: before.company },
      after: parsed.data,
    },
  });
  revalidatePath("/clientes");
  redirect("/clientes");
}
