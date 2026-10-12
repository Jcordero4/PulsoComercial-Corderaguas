import { z } from "zod";
import { ACTIVITY_TYPES } from "./labels";

/** Acepta "1500", "1 500,50", "1500.5". Devuelve string con punto decimal o null si es inválido. */
export function parseAmount(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/[\s₡]/g, "").replace(",", ".");
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) return null;
  return Number(s) > 0 ? s : null;
}

export const activitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES),
    clientId: z.string().min(1, "Selecciona un cliente"),
    note: z.string().trim().max(500, "La nota no puede pasar de 500 caracteres").optional(),
    amount: z.string().optional(),
    sellerId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "VENTA") {
      if (parseAmount(v.amount) === null) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "Una venta requiere un monto mayor a cero (máx. 2 decimales)" });
      }
    } else if (v.amount && v.amount.trim() !== "") {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Solo las ventas llevan monto" });
    }
  });

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  company: z.string().trim().min(1, "Empresa requerida").max(120),
});

import { INDICATORS } from "./labels";

export const goalSchema = z
  .object({
    sellerId: z.string().min(1, "Selecciona un vendedor"),
    indicator: z.enum(INDICATORS),
    year: z.coerce.number().int().min(2024).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    target: z.string(),
  })
  .superRefine((v, ctx) => {
    const t = parseAmount(v.target);
    if (t === null) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "La meta debe ser un número mayor a cero" });
    } else if (v.indicator !== "VENTAS_MONTO" && !/^\d+$/.test(t)) {
      ctx.addIssue({ code: "custom", path: ["target"], message: "Esta meta debe ser un número entero" });
    }
  });

export const passwordSchema = z.string().min(10, "Mínimo 10 caracteres").max(100);

export const userSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  role: z.enum(["VENDEDOR", "GERENTE"]),
  password: passwordSchema,
});
