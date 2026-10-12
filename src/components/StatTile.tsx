export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-[var(--grid)] bg-[var(--surface-1)] p-4">
      <div className="text-sm text-[var(--ink-2)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-[var(--ink-1)]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--ink-3)]">{hint}</div>}
    </div>
  );
}
