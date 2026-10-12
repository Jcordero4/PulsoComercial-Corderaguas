import { ACTIVITY_LABELS, INDICATOR_LABELS, MONTH_NAMES, formatColones, formatTarget } from "./labels";
import type { ActivityTypeValue, IndicatorValue } from "./labels";

type Json = Record<string, unknown> | null | undefined;
type Names = Record<string, string>;

const ACTION_LABELS: Record<string, string> = {
  CREAR: "Creación",
  EDITAR: "Edición",
  ELIMINAR: "Eliminación",
  ACTIVAR: "Activación",
  DESACTIVAR: "Desactivación",
  RESTABLECER_CLAVE: "Cambio de contraseña",
  ANULAR: "Anulación",
  CORREGIR: "Corrección",
};
export const ENTITY_LABELS: Record<string, string> = {
  Client: "Cliente",
  Goal: "Meta",
  User: "Usuario",
  Activity: "Actividad",
};
export const actionLabel = (a: string) => ACTION_LABELS[a] ?? a;

const typeLabel = (t: unknown) => ACTIVITY_LABELS[t as ActivityTypeValue] ?? String(t);
const money = (v: unknown) => (typeof v === "number" ? ` · ${formatColones(v)}` : "");
const goalText = (g: Json, names: Names) => {
  if (!g) return "";
  const ind = g.indicator as IndicatorValue;
  const who = names[String(g.sellerId)] ?? "Vendedor";
  const mes = `${MONTH_NAMES[Number(g.month) - 1] ?? g.month} ${g.year}`;
  return `${who} · ${mes} · ${INDICATOR_LABELS[ind] ?? ind}: ${formatTarget(ind, Number(g.target))}`;
};

/** Texto legible de un cambio del historial. `names` traduce ids de usuario a nombres. */
export function describeChange(
  entity: string,
  action: string,
  entityId: string,
  before: Json,
  after: Json,
  names: Names,
): { summary: string; reason?: string } {
  const reason = typeof after?.motivo === "string" ? after.motivo : undefined;
  switch (entity) {
    case "Client": {
      const fmt = (c: Json) => (c ? `${c.name} — ${c.company}` : "");
      return { summary: action === "EDITAR" ? `${fmt(before)} → ${fmt(after)}` : fmt(after) };
    }
    case "Goal": {
      if (action === "ELIMINAR") return { summary: goalText(before, names) };
      if (action === "EDITAR") {
        const ind = (after?.indicator ?? before?.indicator) as IndicatorValue;
        return {
          summary: `${goalText(after, names)} (antes: ${formatTarget(ind, Number(before?.target))})`,
        };
      }
      return { summary: goalText(after, names) };
    }
    case "User": {
      if (action === "CREAR") {
        return { summary: `${after?.name} (${after?.email}) · ${after?.role === "GERENTE" ? "Gerente" : "Vendedor"}` };
      }
      return { summary: names[entityId] ?? "Usuario" };
    }
    case "Activity": {
      const who = names[String(after?.vendedorId)] ?? "Vendedor";
      if (action === "ANULAR") {
        return { summary: `${typeLabel(before?.type)}${money(before?.amount)} de ${who}`, reason };
      }
      return {
        summary: `${typeLabel(before?.type)}${money(before?.amount)} → ${typeLabel(after?.type)}${money(after?.amount)} (${who})`,
        reason,
      };
    }
    default:
      return { summary: "" };
  }
}
