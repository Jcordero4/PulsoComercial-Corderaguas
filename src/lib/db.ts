import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// DB_SCHEMA solo lo usan las pruebas de integración (esquema temporal aislado).
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL },
  process.env.DB_SCHEMA ? { schema: process.env.DB_SCHEMA } : undefined,
);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
