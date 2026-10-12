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

export const INDICATORS = [
  "LLAMADAS",
  "VISITAS",
  "REUNIONES",
  "COTIZACIONES",
  "VENTAS_CANTIDAD",
  "SEGUIMIENTOS",
  "VENTAS_MONTO",
] as const;
export type IndicatorValue = (typeof INDICATORS)[number];

export const INDICATOR_LABELS: Record<IndicatorValue, string> = {
  LLAMADAS: "Llamadas",
  VISITAS: "Visitas",
  REUNIONES: "Reuniones",
  COTIZACIONES: "Cotizaciones",
  VENTAS_CANTIDAD: "Ventas (cantidad)",
  SEGUIMIENTOS: "Seguimientos",
  VENTAS_MONTO: "Ventas (monto ₡)",
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

export const formatTarget = (indicator: IndicatorValue, v: number | string | { toString(): string }) =>
  indicator === "VENTAS_MONTO" ? formatColones(v) : Number(v.toString()).toLocaleString("es-CR");
