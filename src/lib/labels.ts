export const ACTIVITY_TYPES = [
  "LLAMADA",
  "VISITA",
  "REUNION",
  "COTIZACION",
  "VENTA",
  "SEGUIMIENTO",
] as const;
export type ActivityTypeValue = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityTypeValue, string> = {
  LLAMADA: "Llamada",
  VISITA: "Visita",
  REUNION: "Reunión",
  COTIZACION: "Cotización",
  VENTA: "Venta",
  SEGUIMIENTO: "Seguimiento",
};

const crc = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 2,
});
export const formatColones = (v: number | string | { toString(): string }) =>
  crc.format(Number(v.toString()));

export const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
