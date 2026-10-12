"use client";

import { useState } from "react";
import { useFormAction } from "@/lib/useFormAction";
import { createUser, resetPassword } from "./actions";

const input = "mt-1 block rounded border border-slate-300 px-3 py-2";

export function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VENDEDOR");
  const [password, setPassword] = useState("");
  const { state, onSubmit, pending } = useFormAction(createUser, () => {
    setName("");
    setEmail("");
    setPassword("");
  });
  const err = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-3">
      <label className="text-sm">
        Nombre
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} className={input} />
        {err.name && <span className="block text-red-600">{err.name}</span>}
      </label>
      <label className="text-sm">
        Correo
        <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        {err.email && <span className="block text-red-600">{err.email}</span>}
      </label>
      <label className="text-sm">
        Rol
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={input}>
          <option value="VENDEDOR">Vendedor</option>
          <option value="GERENTE">Gerente / administrador</option>
        </select>
      </label>
      <label className="text-sm">
        Contraseña inicial
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {err.password && <span className="block text-red-600">{err.password}</span>}
      </label>
      <button disabled={pending} className="mt-6 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Creando…" : "Crear usuario"}
      </button>
      {state?.ok && <p className="mt-6 text-sm text-green-700">Usuario creado</p>}
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const { state, onSubmit, pending } = useFormAction(resetPassword.bind(null, userId), () =>
    setPassword(""),
  );
  return (
    <form onSubmit={onSubmit} className="flex items-center justify-end gap-2">
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Nueva contraseña"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-40 rounded border border-slate-300 px-2 py-1"
      />
      <button disabled={pending} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50">
        Cambiar
      </button>
      {state?.error && <span className="text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-green-700">Listo</span>}
    </form>
  );
}
