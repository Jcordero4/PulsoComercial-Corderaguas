"use client";

import { useActionState, useState, useTransition } from "react";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, type ActivityTypeValue } from "@/lib/labels";
import { createActivity } from "./actions";

type Opt = { id: string; label: string };

export function ActivityForm({ clients, sellers }: { clients: Opt[]; sellers?: Opt[] }) {
  const [state, action, actionPending] = useActionState(createActivity, undefined);
  const [submitting, startTransition] = useTransition();
  const pending = actionPending || submitting;
  const [type, setType] = useState<ActivityTypeValue>("LLAMADA");
  // Campos controlados: React 19 resetea el formulario tras cada acción, incluso con errores.
  const [sellerId, setSellerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const err = state?.fieldErrors ?? {};
  const input = "mt-1 block w-full rounded border border-slate-300 px-3 py-2";
  return (
    <form
      // Se envía con onSubmit (no action=) para que React no vacíe el formulario tras un error.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="max-w-md space-y-4"
    >
      {sellers && (
        <label className="block text-sm">
          Vendedor
          <select name="sellerId" required value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={input}>
            <option value="" disabled>
              Selecciona…
            </option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {err.sellerId && <span className="text-red-600">{err.sellerId}</span>}
        </label>
      )}
      <label className="block text-sm">
        Tipo
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as ActivityTypeValue)}
          className={input}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Cliente
        <select name="clientId" required value={clientId} onChange={(e) => setClientId(e.target.value)} className={input}>
          <option value="" disabled>
            Selecciona…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {err.clientId && <span className="text-red-600">{err.clientId}</span>}
      </label>
      {type === "VENTA" && (
        <label className="block text-sm">
          Monto (₡ colones)
          <input
            name="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="150000"
            className={input}
          />
          {err.amount && <span className="text-red-600">{err.amount}</span>}
        </label>
      )}
      <label className="block text-sm">
        Nota (opcional)
        <textarea name="note" maxLength={500} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        {err.note && <span className="text-red-600">{err.note}</span>}
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <p className="text-xs text-slate-500">La fecha se asigna automáticamente al guardar.</p>
      <button
        disabled={pending}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}
