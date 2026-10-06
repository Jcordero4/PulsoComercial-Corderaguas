import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 10) {
  throw new Error("Define SEED_PASSWORD (min. 10 caracteres) en .env");
}

const users: { email: string; name: string; role: Role }[] = [
  { email: "gerente1@pulso.local", name: "Gerente 1", role: "GERENTE" },
  { email: "gerente2@pulso.local", name: "Gerente 2", role: "GERENTE" },
  { email: "vendedor1@pulso.local", name: "Vendedor 1", role: "VENDEDOR" },
  { email: "vendedor2@pulso.local", name: "Vendedor 2", role: "VENDEDOR" },
  { email: "vendedor3@pulso.local", name: "Vendedor 3", role: "VENDEDOR" },
];

async function main() {
  const passwordHash = await bcrypt.hash(password!, 12);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }
  console.log(`Seed OK: ${users.length} usuarios demo`);
}

main().finally(() => prisma.$disconnect());
