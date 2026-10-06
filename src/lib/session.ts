import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppRole } from "@/auth.config";

/** Verifica sesión (y rol opcional) en el servidor; no se confía solo en el proxy. */
export async function requireUser(role?: AppRole) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (role && session.user.role !== role) redirect("/");
  return session.user;
}
