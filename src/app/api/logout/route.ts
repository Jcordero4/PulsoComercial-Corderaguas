import { NextResponse } from "next/server";
import { signOut } from "@/auth";

// Cierra la sesión cuando el token sigue vigente pero el usuario ya no es válido
// (desactivado o eliminado). Evita un bucle entre /login y los paneles.
export async function GET(request: Request) {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login?aviso=bloqueado", request.url));
}
