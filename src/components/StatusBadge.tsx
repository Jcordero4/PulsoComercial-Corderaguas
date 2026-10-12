import type { Status } from "@/lib/indicators";

// El estado nunca depende solo del color: lleva icono y texto.
const CONFIG: Record<Status, { icon: string; label: string; color: string }> = {
  ALCANZADA: { icon: "✔", label: "Meta alcanzada", color: "var(--st-good)" },
  AL_DIA: { icon: "●", label: "Al día", color: "var(--st-ok)" },
  POR_DEBAJO: { icon: "▲", label: "Por debajo", color: "var(--st-serious)" },
  SIN_META: { icon: "—", label: "Sin meta", color: "var(--ink-3)" },
};

export const STATUS_COLOR: Record<Status, string> = {
  ALCANZADA: CONFIG.ALCANZADA.color,
  AL_DIA: CONFIG.AL_DIA.color,
  POR_DEBAJO: CONFIG.POR_DEBAJO.color,
  SIN_META: CONFIG.SIN_META.color,
};

export function StatusBadge({ status }: { status: Status }) {
  const c = CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[var(--ink-2)]">
      <span aria-hidden style={{ color: c.color }}>
        {c.icon}
      </span>
      {c.label}
    </span>
  );
}

/** Medidor: el relleno lleva el estado; la pista es un tono claro del mismo color. */
export function Meter({ ratio, status }: { ratio: number | null; status: Status }) {
  if (ratio === null) return <span className="text-[var(--ink-3)]">—</span>;
  const pct = Math.round(ratio * 100);
  const color = STATUS_COLOR[status];
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-28 overflow-hidden rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 22%, white)` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}
