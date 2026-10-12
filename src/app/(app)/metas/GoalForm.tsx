"use client";

import { useState } from "react";
import { INDICATORS, INDICATOR_LABELS, MONTH_NAMES } from "@/lib/labels";
import { useFormAction } from "@/lib/useFormAction";
import { saveGoal } from "./actions";

type Props = {
  sellers: { id: string; name: string }[];
  year: number;
  month: number;
};

export function GoalForm({ sellers, year, month }: Props) {
  const [sellerId, setSellerId] = useState("");
  const [indicator, setIndicator] = useState<string>(INDICATORS[0]);
  const [target, setTarget] = useState("");
  const { state, onSubmit, pending } = useFormAction(saveGoal, () => setTarget(""));
  const err = state?.fieldErrors ?? {};
  const input = "mt-1 block rounded border border-slate-300 px-3 py-2";
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-3">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <label className="text-sm">
        Vendedor
        <select name="sellerId" required value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={input}>
          <option value="" disabled>
            Selecciona…
          </option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {err.sellerId && <span className="block text-red-600">{err.sellerId}</span>}
      </label>
      <label className="text-sm">
        Indicador
        <select name="indicator" value={indicator} onChange={(e) => setIndicator(e.target.value)} className={input}>
          {INDICATORS.map((i) => (
            <option key={i} value={i}>
              {INDICATOR_LABELS[i]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Meta de {MONTH_NAMES[month - 1].toLowerCase()} {year}
        <input
          name="target"
          inputMode="decimal"
          required
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={input}
        />
        {err.target && <span className="block text-red-600">{err.target}</span>}
      </label>
      <button disabled={pending} className="mt-6 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Guardando…" : "Guardar meta"}
      </button>
      {state?.error && <p role="alert" className="mt-6 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="mt-6 text-sm text-green-700">Meta guardada</p>}
    </form>
  );
}
