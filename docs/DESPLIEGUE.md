# Despliegue en Supabase (PostgreSQL) y Vercel

La aplicación se desarrolla con SQLite. Para producción hay que cambiar el proveedor de base de datos
a PostgreSQL (Supabase). Pasos en orden:

## 1. Crear el proyecto en Supabase

1. Crea un proyecto (región cercana a Costa Rica, por ejemplo Virginia o São Paulo) y guarda la
   contraseña de la base de datos en un gestor de contraseñas.
2. En *Project Settings → Database → Connection string* copia dos cadenas:
   - **Pooler, modo transaction (puerto 6543)** → será `DATABASE_URL` (para la app en Vercel).
   - **Conexión directa o session (puerto 5432)** → será `DIRECT_URL` (para migraciones).
3. Nunca pegues estas cadenas en el chat, en el repositorio ni en capturas.

## 2. Cambiar el código a PostgreSQL

1. `prisma/schema.prisma`: cambiar `provider = "sqlite"` por `provider = "postgresql"`.
2. Instalar el adapter de Postgres y quitar el de SQLite:
   `npm i @prisma/adapter-pg pg` y `npm rm @prisma/adapter-better-sqlite3 better-sqlite3`.
3. `src/lib/db.ts` y `prisma/seed.ts`: usar `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
   en lugar del adapter de SQLite.
4. `prisma.config.ts`: `datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL }`.
5. Las migraciones actuales son de SQLite y **no sirven para PostgreSQL**. Bórralas
   (`prisma/migrations`) y crea una migración inicial nueva contra una base vacía:
   `npx prisma migrate dev --name init` (con `DIRECT_URL` apuntando a Supabase o a un Postgres local).
6. Comprobar con `npm test`. Las pruebas de integración usan SQLite; si el proveedor cambia, adaptarlas
   para que usen una base PostgreSQL de prueba.

## 3. Aplicar el esquema y crear usuarios

```bash
npx prisma migrate deploy      # con DIRECT_URL de Supabase
```

Para el primer acceso puedes correr `npm run db:seed` con una `SEED_PASSWORD` **fuerte y temporal**, entrar
como gerente, crear los usuarios reales, desactivar los de ejemplo y cambiar las contraseñas. Después
cambia o elimina la `SEED_PASSWORD`.

## 4. Publicar en Vercel

1. Importa el repositorio de GitHub en Vercel (framework: Next.js).
2. Variables de entorno (Production y Preview):
   - `DATABASE_URL` — pooler (6543), con `?pgbouncer=true`.
   - `DIRECT_URL` — conexión directa (5432).
   - `AUTH_SECRET` — generado con `npx auth secret`. Distinto al de desarrollo.
   - `AUTH_TRUST_HOST=true` — **solo si no despliegas en Vercel** (Vercel lo activa solo). Sin esto el inicio
     de sesión falla en producción con "UntrustedHost".
3. `postinstall` ya ejecuta `prisma generate`. Las migraciones se aplican aparte (paso 3), no en cada build.
4. Desplegar y probar con la lista de abajo.

## 5. Lista de comprobación tras el despliegue

- [ ] Iniciar sesión como gerente y como vendedor.
- [ ] El vendedor solo ve lo suyo y no entra a `/gerente`, `/usuarios` ni `/historial`.
- [ ] Registrar una actividad y una venta; la fecha y el mes son correctos (hora de Costa Rica).
- [ ] Definir una meta y ver el progreso en el panel.
- [ ] Corregir y anular una venta; aparece en el historial con autor y fecha.
- [ ] Cerrar sesión y volver a entrar: los datos siguen ahí.
- [ ] Las cuentas de ejemplo están desactivadas y las contraseñas iniciales cambiadas.
- [ ] El sitio responde solo por HTTPS (Vercel lo hace por defecto).

## Seguridad y mantenimiento

- Respaldos: activa los respaldos automáticos de Supabase y verifica cómo restaurar.
- Rota `AUTH_SECRET` y las contraseñas de base de datos si se filtran (rotar `AUTH_SECRET` cierra todas las sesiones).
- `npm audit` reporta vulnerabilidades altas en `mysql2` y `deepmerge-ts`, dependencias internas de la CLI de
  Prisma (herramienta de desarrollo, no se ejecuta en la aplicación). Revisar al actualizar Prisma.
- El bloqueo por intentos fallidos se guarda en la base de datos, por lo que funciona igual en
  funciones serverless de Vercel.
