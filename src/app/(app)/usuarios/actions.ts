"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { passwordSchema, userSchema } from "@/lib/validators";
import type { FormState } from "@/lib/useFormAction";

const BCRYPT_ROUNDS = 12;

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireUser("GERENTE");
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const { password, ...data } = parsed.data;
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    return { fieldErrors: { email: "Ya existe un usuario con ese correo" } };
  }
  const user = await prisma.user.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
  });
  await prisma.auditLog.create({
    data: { actorId: actor.id, entity: "User", entityId: user.id, action: "CREAR", after: data },
  });
  revalidatePath("/usuarios");
  return { ok: true };
}

export async function setUserActive(id: string, active: boolean) {
  const actor = await requireUser("GERENTE");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.active === active) return;
  if (!active) {
    if (target.id === actor.id) return; // no puede desactivarse a sí mismo
    if (target.role === "GERENTE") {
      const otherManagers = await prisma.user.count({
        where: { role: "GERENTE", active: true, id: { not: id } },
      });
      if (otherManagers === 0) return; // siempre debe quedar un gerente activo
    }
  }
  await prisma.user.update({ where: { id }, data: { active } });
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      entity: "User",
      entityId: id,
      action: active ? "ACTIVAR" : "DESACTIVAR",
      before: { active: target.active },
      after: { active },
    },
  });
  revalidatePath("/usuarios");
}

export async function resetPassword(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireUser("GERENTE");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Usuario no encontrado" };
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data, BCRYPT_ROUNDS) },
  });
  // El historial registra el evento, nunca la contraseña ni su hash.
  await prisma.auditLog.create({
    data: { actorId: actor.id, entity: "User", entityId: id, action: "RESTABLECER_CLAVE" },
  });
  return { ok: true };
}
