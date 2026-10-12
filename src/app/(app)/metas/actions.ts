"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { goalSchema, parseAmount } from "@/lib/validators";
import type { FormState } from "@/lib/useFormAction";

// Crea o actualiza la meta de un vendedor para un mes e indicador. Solo gerencia.
export async function saveGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("GERENTE");
  const parsed = goalSchema.safeParse({
    sellerId: formData.get("sellerId"),
    indicator: formData.get("indicator"),
    year: formData.get("year"),
    month: formData.get("month"),
    target: formData.get("target"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const v = parsed.data;
  const seller = await prisma.user.findFirst({ where: { id: v.sellerId, role: "VENDEDOR", active: true } });
  if (!seller) return { fieldErrors: { sellerId: "Vendedor no válido" } };

  const key = { sellerId: v.sellerId, year: v.year, month: v.month, indicator: v.indicator };
  const target = parseAmount(v.target)!;
  const existing = await prisma.goal.findUnique({ where: { sellerId_year_month_indicator: key } });
  const goal = await prisma.goal.upsert({
    where: { sellerId_year_month_indicator: key },
    update: { target },
    create: { ...key, target },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: "Goal",
      entityId: goal.id,
      action: existing ? "EDITAR" : "CREAR",
      before: existing ? { ...key, target: Number(existing.target) } : undefined,
      after: { ...key, target: Number(target) },
    },
  });
  revalidatePath("/metas");
  return { ok: true };
}

export async function deleteGoal(id: string) {
  const user = await requireUser("GERENTE");
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return;
  await prisma.goal.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: "Goal",
      entityId: id,
      action: "ELIMINAR",
      before: {
        sellerId: goal.sellerId,
        year: goal.year,
        month: goal.month,
        indicator: goal.indicator,
        target: Number(goal.target),
      },
    },
  });
  revalidatePath("/metas");
}
