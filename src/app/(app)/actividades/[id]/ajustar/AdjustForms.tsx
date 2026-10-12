"use client";

import { useState } from "react";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, type ActivityTypeValue } from "@/lib/labels";
import { useFormAction } from "@/lib/useFormAction";
import { correctActivity, voidActivity } from "./actions";

const input = "mt-1 block w-full rounded border border-slate-300 px-3 py-2";

export function CorrectForm({
  activityId,
  current,
}: {
  activityId: string;
  current: { type: ActivityTypeValue; amount: number | null };
}) {
  const [type, setType] = useState<ActivityTypeValue>(current.type);
  const [amount, setAmount] = useState(current.amount === null ? "" : String(current.amount));
  const [reason, setReason] = useState("");
  const { state, onSubmit, pending } = useFormAction(correctActivity.bind(null, activityId), () =>
    setReason(""),
  );
  const err = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <label className="block text-sm">
        Tipo
        <select name="type" value={type} onChange={(e) => setType(e.target.value as ActivityTypeValue)} className={input}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_LABELS[t]}
            </option>
          ))}
        </select>
        {err.type && <span className="text-red-600">{err.type}</span>}
      </label>
      {type === "VENTA" && (
        <label className="block text-sm">
          Monto (₡ colones)
          <input name="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
          {err.amount && <span className="text-red-600">{err.amount}</span>}
        </label>
      )}
      <label className="block text-sm">
        Motivo de la corrección
        <textarea name="reason" rows={2} maxLength={300} required value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
        {err.reason && <span className="text-red-600">{err.reason}</span>}
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Corrección registrada</p>}
      <button disabled={pending} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Registrar corrección"}
      </button>
    </form>
  );
}

export function VoidForm({ activityId }: { activityId: string }) {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const { state, onSubmit, pending } = useFormAction(voidActivity.bind(null, activityId), () => {
    setReason("");
    setConfirm(false);
  });
  const err = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <label className="block text-sm">
        Motivo de la anulación
        <textarea name="reason" rows={2} maxLength={300} required value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
        {err.reason && <span className="text-red-600">{err.reason}</span>}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        Entiendo que esto resta el registro del avance del mes actual
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Registro anulado</p>}
      <button disabled={pending || !confirm} className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Anulando…" : "Anular registro"}
      </button>
    </form>
  );
}
