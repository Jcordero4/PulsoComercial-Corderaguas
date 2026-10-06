"use client";

import { useActionState, useState, useTransition } from "react";
import type { FormState } from "./actions";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: { name: string; company: string };
  submitLabel: string;
};

export function ClientForm({ action, initial, submitLabel }: Props) {
  // Controlados para conservar lo escrito si hay errores (React 19 resetea el form).
  const [name, setName] = useState(initial?.name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [submitting, startTransition] = useTransition();
  const [state, formAction, actionPending] = useActionState(
    async (prev: FormState, fd: FormData) => {
      const res = await action(prev, fd);
      if (res?.ok) {
        setName("");
        setCompany("");
      }
      return res;
    },
    undefined,
  );
  const pending = actionPending || submitting;
  const input = "mt-1 block rounded border border-slate-300 px-3 py-2";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="flex flex-wrap items-start gap-3"
    >
      <label className="text-sm">
        Nombre
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className={input} />
        {state?.fieldErrors?.name && <span className="text-red-600">{state.fieldErrors.name}</span>}
      </label>
      <label className="text-sm">
        Empresa
        <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} required className={input} />
        {state?.fieldErrors?.company && (
          <span className="text-red-600">{state.fieldErrors.company}</span>
        )}
      </label>
      <button
        disabled={pending}
        className="mt-6 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
      {state?.error && (
        <p role="alert" className="mt-6 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="mt-6 text-sm text-green-700">Cliente guardado</p>}
    </form>
  );
}
