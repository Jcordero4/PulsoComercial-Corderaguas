import type { EffectiveState } from "@/lib/adjustments";
import { ACTIVITY_LABELS, formatColones } from "@/lib/labels";

/** Estado de un registro tras correcciones/anulaciones (icono + texto, nunca solo color). */
export function ActivityState({ state }: { state: EffectiveState }) {
  if (state.voided) {
    return (
      <span className="whitespace-nowrap text-[var(--ink-2)]">
        <span aria-hidden className="text-[var(--st-critical)]">✕ </span>Anulado
      </span>
    );
  }
  if (state.corrected) {
    return (
      <span className="text-[var(--ink-2)]">
        <span aria-hidden className="text-[var(--st-ok)]">✎ </span>
        Corregido: {ACTIVITY_LABELS[state.type]}
        {state.amount != null && ` · ${formatColones(state.amount)}`}
      </span>
    );
  }
  return <span className="text-[var(--ink-3)]">Vigente</span>;
}
