"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ notice }: { notice?: string }) {
  const [error, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Pulso Comercial</h1>
      <p className="text-sm text-slate-500">Corderaguas · Inicio de sesión</p>
      {notice && (
        <p role="status" className="rounded bg-amber-50 p-2 text-sm text-amber-800">
          {notice}
        </p>
      )}
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
      <p className="text-xs text-slate-500">Tras 5 intentos fallidos el acceso se bloquea 15 minutos.</p>
      <button disabled={pending}
        className="w-full rounded bg-slate-900 py-2 text-white disabled:opacity-50">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
