import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppRole } from "@/auth.config";
import { prisma } from "@/lib/db";

/**
 * Verifica sesión y rol en el servidor (no se confía solo en el proxy).
 * Consulta la BD para que un usuario desactivado o con rol cambiado pierda acceso de inmediato,
 * aunque su token siga vigente.
 */
export async function requireUser(role?: AppRole) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!dbUser || !dbUser.active) redirect("/api/logout");
  if (role && dbUser.role !== role) redirect("/");
  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role as AppRole };
}
