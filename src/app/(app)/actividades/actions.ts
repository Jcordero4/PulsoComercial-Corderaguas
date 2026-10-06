"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { periodOf } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { activitySchema, parseAmount } from "@/lib/validators";
import type { FormState } from "../clientes/actions";

export async function createActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    clientId: formData.get("clientId"),
    note: formData.get("note") || undefined,
    amount: formData.get("amount") || undefined,
    sellerId: formData.get("sellerId") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const v = parsed.data;

  // Vendedor: siempre a su nombre (se ignora sellerId). Gerente: debe elegir un vendedor activo.
  let sellerId = user.id;
  if (user.role === "GERENTE") {
    const seller = v.sellerId
      ? await prisma.user.findFirst({ where: { id: v.sellerId, role: "VENDEDOR", active: true } })
      : null;
    if (!seller) return { fieldErrors: { sellerId: "Selecciona un vendedor" } };
    sellerId = seller.id;
  }

  const client = await prisma.client.findUnique({ where: { id: v.clientId } });
  if (!client) return { fieldErrors: { clientId: "Cliente no válido" } };

  // La fecha la asigna el servidor; el mes se calcula en America/Costa_Rica.
  const now = new Date();
  const { year, month } = periodOf(now);
  await prisma.activity.create({
    data: {
      sellerId,
      clientId: v.clientId,
      type: v.type,
      note: v.note || null,
      amount: v.type === "VENTA" ? parseAmount(v.amount) : null,
      createdAt: now,
      periodYear: year,
      periodMonth: month,
    },
  });
  revalidatePath("/actividades");
  redirect("/actividades");
}
