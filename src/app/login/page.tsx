"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, undefined);
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Pulso Comercial</h1>
        <p className="text-sm text-slate-500">Corderaguas · Inicio de sesión</p>
        <label className="block text-sm">
          Correo
          <input name="email" type="email" required autoComplete="username"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          Contraseña
          <input name="password" type="password" required autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending}
          className="w-full rounded bg-slate-900 py-2 text-white disabled:opacity-50">
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
