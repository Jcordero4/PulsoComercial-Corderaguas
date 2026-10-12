"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  effectiveState,
  planCorrection,
  planVoid,
  type AdjustmentPlan,
  type EffectiveState,
} from "@/lib/adjustments";
import { ACTIVITY_TYPES, type ActivityTypeValue } from "@/lib/labels";
import { periodOf } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { parseAmount } from "@/lib/validators";
import type { FormState } from "@/lib/useFormAction";

const reasonSchema = z
  .string()
  .trim()
  .min(5, "Explica el motivo (mínimo 5 caracteres)")
  .max(300, "El motivo no puede pasar de 300 caracteres");

type Kind = "CORRECCION" | "ANULACION";

/**
 * Aplica un ajuste: la actividad original no se toca. Se crean filas de ajuste que cuentan en el
 * MES ACTUAL (aunque la actividad sea de un periodo cerrado) y una entrada en el historial.
 */
async function applyAdjustment(
  activityId: string,
  kind: Kind,
  reasonRaw: unknown,
  plan: (eff: EffectiveState) => AdjustmentPlan,
): Promise<FormState> {
  const actor = await requireUser("GERENTE");
  const reason = reasonSchema.safeParse(reasonRaw);
  if (!reason.success) return { fieldErrors: { reason: reason.error.issues[0].message } };

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return { error: "Actividad no encontrada" };

  return prisma.$transaction(async (tx) => {
    // El estado se recalcula dentro de la transacción para no ajustar sobre datos viejos.
    const adjs = await tx.adjustment.findMany({ where: { activityId } });
    const eff = effectiveState(
      {
        type: activity.type as ActivityTypeValue,
        amount: activity.amount === null ? null : Number(activity.amount.toString()),
      },
      adjs.map((a) => ({
        kind: a.kind as Kind,
        afterType: a.afterType as ActivityTypeValue | null,
        afterAmount: a.afterAmount === null ? null : Number(a.afterAmount.toString()),
        createdAt: a.createdAt,
      })),
    );
    const result = plan(eff);
    if (!result.ok) return { error: result.error } as FormState;

    const { year, month } = periodOf();
    const groupId = crypto.randomUUID();
    for (const row of result.rows) {
      await tx.adjustment.create({
        data: {
          activityId,
          sellerId: activity.sellerId,
          kind,
          type: row.type,
          deltaCount: row.deltaCount,
          deltaAmount: row.deltaAmount,
          groupId,
          afterType: result.afterType,
          afterAmount: result.afterAmount,
          reason: reason.data,
          actorId: actor.id,
          periodYear: year,
          periodMonth: month,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        entity: "Activity",
        entityId: activityId,
        action: kind === "ANULACION" ? "ANULAR" : "CORREGIR",
        before: { type: eff.type, amount: eff.amount },
        after:
          kind === "ANULACION"
            ? { anulada: true, vendedorId: activity.sellerId, motivo: reason.data }
            : {
                type: result.afterType,
                amount: result.afterAmount,
                vendedorId: activity.sellerId,
                motivo: reason.data,
              },
      },
    });
    return { ok: true } as FormState;
  });
}

function revalidate() {
  revalidatePath("/actividades");
  revalidatePath("/historial");
  revalidatePath("/gerente");
  revalidatePath("/vendedor");
}

export async function voidActivity(
  activityId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const res = await applyAdjustment(activityId, "ANULACION", formData.get("reason"), (eff) => planVoid(eff));
  if (res?.ok) revalidate();
  return res;
}

export async function correctActivity(
  activityId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const type = z.enum(ACTIVITY_TYPES).safeParse(formData.get("type"));
  if (!type.success) return { fieldErrors: { type: "Tipo no válido" } };
  const rawAmount = String(formData.get("amount") ?? "").trim();
  let amount: number | null = null;
  if (type.data === "VENTA") {
    const parsed = parseAmount(rawAmount);
    if (parsed === null) return { fieldErrors: { amount: "Una venta requiere un monto mayor a cero (máx. 2 decimales)" } };
    amount = Number(parsed);
  }
  const res = await applyAdjustment(activityId, "CORRECCION", formData.get("reason"), (eff) =>
    planCorrection(eff, { type: type.data, amount }),
  );
  if (res?.ok) revalidate();
  return res;
}
