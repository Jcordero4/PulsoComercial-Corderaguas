import Link from "next/link";
import { signOut } from "@/auth";
import type { AppRole } from "@/auth.config";

export function Nav({ name, role }: { name?: string | null; role: AppRole }) {
  const home = role === "GERENTE" ? "/gerente" : "/vendedor";
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 p-4 text-sm">
        <Link href={home} className="font-semibold">Pulso Comercial</Link>
        <Link href="/actividades/nueva">Registrar</Link>
        <Link href="/actividades">Actividades</Link>
        <Link href="/clientes">Clientes</Link>
        <span className="ml-auto text-slate-500">{name} · {role === "GERENTE" ? "Gerente" : "Vendedor"}</span>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="rounded bg-slate-900 px-3 py-1 text-white">Salir</button>
        </form>
      </nav>
    </header>
  );
}
