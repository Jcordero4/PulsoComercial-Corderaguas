// Datos de demostración SOLO para desarrollo: npm run db:demo
// Crea clientes, metas del mes actual y actividades con avances distintos por vendedor.
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type ActivityType, type Indicator } from "../src/generated/prisma/client";
import { periodOf } from "../src/lib/period";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const GOALS: Record<Indicator, number> = {
  LLAMADAS: 40,
  VISITAS: 10,
  REUNIONES: 8,
  COTIZACIONES: 12,
  VENTAS_CANTIDAD: 6,
  SEGUIMIENTOS: 20,
  VENTAS_MONTO: 3_000_000,
};

// Actividades a registrar por vendedor (ventas llevan monto promedio indicado).
const PLAN: Record<string, Partial<Record<ActivityType, number>> & { montoVenta: number }> = {
  "vendedor1@pulso.local": { LLAMADA: 44, VISITA: 9, REUNION: 8, COTIZACION: 10, VENTA: 6, SEGUIMIENTO: 18, montoVenta: 560_000 },
  "vendedor2@pulso.local": { LLAMADA: 22, VISITA: 4, REUNION: 4, COTIZACION: 6, VENTA: 3, SEGUIMIENTO: 11, montoVenta: 450_000 },
  "vendedor3@pulso.local": { LLAMADA: 9, VISITA: 1, REUNION: 2, COTIZACION: 2, VENTA: 1, SEGUIMIENTO: 3, montoVenta: 400_000 },
};

async function main() {
  const { year, month } = periodOf();
  const manager = await prisma.user.findFirstOrThrow({ where: { role: "GERENTE" } });

  let clients = await prisma.client.findMany({ take: 3 });
  if (clients.length < 3) {
    const extra = [
      { name: "Luis Mora", company: "Ferretería Central" },
      { name: "Ana Solís", company: "Agroinsumos del Valle" },
    ];
    for (const c of extra) {
      await prisma.client.create({ data: { ...c, createdById: manager.id } });
    }
    clients = await prisma.client.findMany({ take: 3 });
  }

  for (const [email, plan] of Object.entries(PLAN)) {
    const seller = await prisma.user.findUnique({ where: { email } });
    if (!seller) continue;

    for (const [indicator, target] of Object.entries(GOALS)) {
      await prisma.goal.upsert({
        where: { sellerId_year_month_indicator: { sellerId: seller.id, year, month, indicator: indicator as Indicator } },
        update: { target },
        create: { sellerId: seller.id, year, month, indicator: indicator as Indicator, target },
      });
    }

    const already = await prisma.activity.count({
      where: { sellerId: seller.id, periodYear: year, periodMonth: month, note: "demo" },
    });
    if (already > 0) continue; // idempotente

    const rows = [];
    for (const [type, n] of Object.entries(plan)) {
      if (type === "montoVenta") continue;
      for (let i = 0; i < (n as number); i++) {
        rows.push({
          sellerId: seller.id,
          clientId: clients[i % clients.length].id,
          type: type as ActivityType,
          note: "demo",
          amount: type === "VENTA" ? plan.montoVenta + i * 1000 : null,
          periodYear: year,
          periodMonth: month,
        });
      }
    }
    await prisma.activity.createMany({ data: rows });
  }
  console.log(`Demo OK para ${month}/${year}`);
}

main().finally(() => prisma.$disconnect());
