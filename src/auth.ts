import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { afterFailedLogin, isLocked } from "@/lib/lockout";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Hash de una clave inexistente: se compara aunque el usuario no exista para que el tiempo
// de respuesta no revele qué correos están registrados.
const DUMMY_HASH = "$2b$12$hC/MLf0eeoOxqnSKURsPk.50b8OrblLJM/mKdNTkB3OTQEH30llkq";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    // Un login fallido es esperado: no se imprime como error con stack trace.
    error(error) {
      if ((error as { type?: string }).type === "CredentialsSignin") return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.active) return null;
        // Cuenta bloqueada por intentos fallidos: se rechaza incluso con la clave correcta.
        if (isLocked(user.lockedUntil)) return null;
        if (!ok) {
          await prisma.user.update({ where: { id: user.id }, data: afterFailedLogin(user.failedLogins) });
          return null;
        }
        if (user.failedLogins > 0 || user.lockedUntil) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
        }
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
