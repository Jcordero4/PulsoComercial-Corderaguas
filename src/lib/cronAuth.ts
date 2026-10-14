import { timingSafeEqual } from "node:crypto";

/**
 * Vercel envía `Authorization: Bearer <CRON_SECRET>` al invocar un cron.
 * Sin CRON_SECRET configurado se rechaza todo (nunca queda abierta). La comparación es de tiempo
 * constante para no filtrar el secreto por diferencias de tiempo de respuesta.
 */
export function isCronAuthorized(authHeader: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
