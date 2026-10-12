// Prueba de integración: usa una base SQLite temporal con las migraciones reales.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { periodOf } from "./period";

const dbFile = `test-integration-${process.pid}.db`;
type Db = typeof import("./db").prisma;
let prisma: Db;
let loadMetrics: typeof import("./stats").loadMetrics;
let ids: { v1: string; v2: string; manager: string; client: string };

const cur = periodOf();
const prev = cur.month === 1 ? { year: cur.year - 1, month: 12 } : { year: cur.year, month: cur.month - 1 };

beforeAll(async () => {
  process.env.DATABASE_URL = `file:./${dbFile}`;
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "pipe" });
  ({ prisma } = await import("./db"));
  ({ loadMetrics } = await import("./stats"));

  const mk = (email: string, role: "VENDEDOR" | "GERENTE") =>
    prisma.user.create({ data: { email, name: email, role, passwordHash: "x" } });
  const [v1, v2, manager] = await Promise.all([
    mk("v1@t.local", "VENDEDOR"),
    mk("v2@t.local", "VENDEDOR"),
    mk("g@t.local", "GERENTE"),
  ]);
  const client = await prisma.client.create({ data: { name: "C", company: "E", createdById: manager.id } });
  ids = { v1: v1.id, v2: v2.id, manager: manager.id, client: client.id };
});

afterAll(async () => {
  await prisma?.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) rmSync(`${dbFile}${suffix}`, { force: true });
});

const act = (sellerId: string, type: "LLAMADA" | "VENTA" | "VISITA", p = cur, amount: number | null = null) =>
  prisma.activity.create({
    data: { sellerId, clientId: ids.client, type, amount, periodYear: p.year, periodMonth: p.month },
  });

describe("avance por indicador (BD real)", () => {
  it("cada actividad suma solo a su indicador y la venta suma monto", async () => {
    await act(ids.v1, "LLAMADA");
    await act(ids.v1, "LLAMADA");
    await act(ids.v1, "VENTA", cur, 150000.5);
    await prisma.goal.create({
      data: { sellerId: ids.v1, year: cur.year, month: cur.month, indicator: "LLAMADAS", target: 4 },
    });

    const [m] = await loadMetrics([{ id: ids.v1, name: "v1" }], cur);
    const row = (i: string) => m.rows.find((r) => r.indicator === i)!;
    expect(row("LLAMADAS")).toMatchObject({ actual: 2, target: 4, ratio: 0.5, shortfall: 2 });
    expect(row("VISITAS").actual).toBe(0);
    expect(row("VENTAS_CANTIDAD").actual).toBe(1);
    expect(row("VENTAS_MONTO").actual).toBe(150000.5);
    expect(row("VENTAS_CANTIDAD").status).toBe("SIN_META");
  });

  it("no mezcla datos entre vendedores", async () => {
    await act(ids.v2, "VISITA");
    const [m1] = await loadMetrics([{ id: ids.v1, name: "v1" }], cur);
    const [m2] = await loadMetrics([{ id: ids.v2, name: "v2" }], cur);
    expect(m1.rows.find((r) => r.indicator === "VISITAS")!.actual).toBe(0);
    expect(m2.rows.find((r) => r.indicator === "VISITAS")!.actual).toBe(1);
    expect(m2.rows.find((r) => r.indicator === "LLAMADAS")!.actual).toBe(0);
  });

  it("meta alcanzada: faltante cero", async () => {
    await prisma.goal.update({
      where: {
        sellerId_year_month_indicator: { sellerId: ids.v1, year: cur.year, month: cur.month, indicator: "LLAMADAS" },
      },
      data: { target: 2 },
    });
    const [m] = await loadMetrics([{ id: ids.v1, name: "v1" }], cur);
    expect(m.rows.find((r) => r.indicator === "LLAMADAS")).toMatchObject({
      status: "ALCANZADA",
      shortfall: 0,
    });
  });
});

describe("ajuste de una venta de periodo cerrado", () => {
  it("se cuenta en el mes actual y no cambia el mes cerrado", async () => {
    const venta = await act(ids.v2, "VENTA", prev, 500000);
    const before = await loadMetrics([{ id: ids.v2, name: "v2" }], cur);
    const montoAntes = before[0].rows.find((r) => r.indicator === "VENTAS_MONTO")!.actual;

    // Anulación hecha hoy: el ajuste va al mes actual.
    await prisma.adjustment.create({
      data: {
        activityId: venta.id,
        sellerId: ids.v2,
        kind: "ANULACION",
        type: "VENTA",
        deltaCount: -1,
        deltaAmount: -500000,
        reason: "Cancelada",
        actorId: ids.manager,
        periodYear: cur.year,
        periodMonth: cur.month,
      },
    });

    const [mPrev] = await loadMetrics([{ id: ids.v2, name: "v2" }], prev);
    const [mCur] = await loadMetrics([{ id: ids.v2, name: "v2" }], cur);
    const get = (m: typeof mPrev, i: string) => m.rows.find((r) => r.indicator === i)!.actual;

    expect(get(mPrev, "VENTAS_CANTIDAD")).toBe(1); // el periodo cerrado no cambia
    expect(get(mPrev, "VENTAS_MONTO")).toBe(500000);
    expect(get(mCur, "VENTAS_CANTIDAD")).toBe(-1); // el ajuste cae en el mes actual
    expect(get(mCur, "VENTAS_MONTO")).toBe(montoAntes - 500000);
  });
});

describe("restricciones de datos", () => {
  it("una sola meta por vendedor, mes e indicador", async () => {
    await expect(
      prisma.goal.create({
        data: { sellerId: ids.v1, year: cur.year, month: cur.month, indicator: "LLAMADAS", target: 9 },
      }),
    ).rejects.toThrow();
  });
  it("el correo de usuario es único", async () => {
    await expect(
      prisma.user.create({ data: { email: "v1@t.local", name: "dup", role: "VENDEDOR", passwordHash: "x" } }),
    ).rejects.toThrow();
  });
});
