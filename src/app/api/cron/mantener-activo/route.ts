import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";

// Tarea programada de Vercel (vercel.json): una consulta mínima a la base de datos todos los días
// para que Supabase no pause el proyecto gratuito por inactividad. No devuelve datos del negocio.
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch (error) {
    console.error("cron mantener-activo: falló la consulta a la base de datos", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
