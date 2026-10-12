import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Las migraciones usan la conexión directa (session pooler); la app usa el pooler transaction.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
