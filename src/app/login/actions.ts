"use server";

import bcrypt from "bcryptjs";
import { unstable_rethrow } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

const GENERIC_ERROR = "Correo o contraseña incorrectos";

export async function login(_prev: string | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    // Solo se avisa que el usuario está bloqueado si la contraseña es correcta,
    // para no revelar a terceros qué correos existen.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.active && (await bcrypt.compare(password, user.passwordHash))) {
      return "Tu usuario está bloqueado. Contacta a gerencia.";
    }
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    unstable_rethrow(e); // deja pasar el redirect interno de Next tras un login correcto
    if (e instanceof AuthError) return GENERIC_ERROR;
    console.error("login failed", e);
    return "No se pudo iniciar sesión por un problema del sistema. Intenta de nuevo.";
  }
}
