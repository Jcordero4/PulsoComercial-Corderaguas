# Despliegue en Supabase (PostgreSQL) y Vercel

La aplicación usa PostgreSQL de Supabase tanto en desarrollo como en producción. El mismo proyecto de
Supabase sirve para ambos mientras no haya datos reales; cuando los haya, conviene crear un segundo
proyecto para desarrollo.

## 1. Supabase (ya hecho en este proyecto)

1. Proyecto creado (región `us-west-2`).
2. Botón **Connect** → pestaña **ORM → Prisma**: copiar `DATABASE_URL` (pooler de transacciones, puerto 6543)
   y `DIRECT_URL` (pooler de sesión, puerto 5432) al archivo `.env`.
   Si la contraseña tiene caracteres especiales hay que codificarlos (`#` → `%23`, `@` → `%40`…).
3. Aplicar el esquema: `npx prisma migrate deploy`.
4. **Activar RLS en `_prisma_migrations`.** Las migraciones de la app ya activan RLS en las tablas propias
   y retiran permisos a los roles de la API pública (`anon`, `authenticated`). La tabla interna de Prisma
   la crea Prisma y hay que protegerla a mano, una sola vez:
   ```sql
   ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
   REVOKE ALL ON TABLE "_prisma_migrations" FROM anon, authenticated;
   ```
   (Se puede ejecutar en *SQL Editor* de Supabase.)
   Por qué importa: Supabase expone las tablas de `public` por su API REST con la clave anónima. Sin RLS,
   cualquiera con esa clave podría leer o escribir los datos. La aplicación se conecta como `postgres`
   (ignora RLS), así que no se ve afectada.
5. Crear los usuarios de ejemplo: `npm run db:seed` (ver paso 3).

## 2. Vercel

1. Importar el repositorio de GitHub en Vercel (framework: Next.js; no cambiar los comandos).
2. Variables de entorno (Production y Preview), copiadas desde tu `.env`:
   - `DATABASE_URL` — pooler de transacciones (6543, con `?pgbouncer=true`).
   - `DIRECT_URL` — pooler de sesión (5432). El build no ejecuta migraciones, pero se deja por consistencia.
   - `AUTH_SECRET` — **uno distinto al de desarrollo**, generado con `npx auth secret`.
   - `AUTH_TRUST_HOST=true` — solo si no despliegas en Vercel (allí se activa solo). Sin esto el inicio de
     sesión falla con "UntrustedHost".
   - `CRON_SECRET` — aleatorio de 16+ caracteres. Protege la tarea diaria que evita que Supabase pause el
     proyecto (ver «Tarea diaria» abajo). Tras agregarla hay que **volver a desplegar** para que tome efecto.
   - **No** definas `SEED_PASSWORD` en Vercel: solo se usa en tu computadora.
3. `postinstall` ejecuta `prisma generate`. Las migraciones se aplican aparte (`npx prisma migrate deploy`
   desde tu computadora), no en cada build.
4. Desplegar y recorrer la lista de comprobación.

## 3. Usuarios reales

`npm run db:seed` crea Gerente 1-2 y Vendedor 1-3 (`*@pulso.local`) con la contraseña `SEED_PASSWORD`.
Entra como gerente, crea los usuarios reales en *Usuarios*, **desactiva los de ejemplo** y cambia las
contraseñas. Los datos de demostración (`prisma/demo.ts`) son solo para una base de pruebas y exigen
`ALLOW_DEMO_DATA=true`; **no los ejecutes en la base de producción**.

## 4. Lista de comprobación tras el despliegue

- [ ] Iniciar sesión como gerente y como vendedor.
- [ ] El vendedor solo ve lo suyo y no entra a `/gerente`, `/usuarios` ni `/historial`.
- [ ] Registrar una actividad y una venta; la fecha y el mes son correctos (hora de Costa Rica).
- [ ] Definir una meta y ver el progreso en el panel.
- [ ] Corregir y anular una venta; aparece en el historial con autor y fecha.
- [ ] Cerrar sesión y volver a entrar: los datos siguen ahí.
- [ ] Las cuentas de ejemplo están desactivadas y las contraseñas iniciales cambiadas.
- [ ] El sitio responde solo por HTTPS (Vercel lo hace por defecto).

## Tarea diaria que evita la pausa de Supabase

El plan gratuito de Supabase pausa los proyectos con poca actividad durante 7 días. Para evitarlo,
`vercel.json` programa una llamada diaria a `/api/cron/mantener-activo` (13:00 UTC, 7:00 a. m. en Costa Rica), que
hace una consulta mínima (`SELECT 1`) a la base. Quien ejecuta la tarea es **Vercel**, no tu computadora.

- La ruta exige `Authorization: Bearer <CRON_SECRET>` (Vercel lo envía solo). Sin `CRON_SECRET` rechaza todo.
- En el plan Hobby corre una vez al día, en cualquier momento dentro de esa hora. Solo se ejecuta en el
  despliegue de Producción. Si falla, Vercel **no reintenta**.
- **Cómo comprobar que corre:** Vercel → proyecto → *Settings → Cron Jobs* (ver la tarea y su última ejecución,
  y *View Logs*). Revísalo la primera semana y luego de vez en cuando.
- Si ves un 401 en el log: falta o es distinto `CRON_SECRET` en Vercel, o no se volvió a desplegar tras agregarlo.
- Es un parche para el plan gratuito. Para datos reales de producción, el plan de pago de Supabase elimina las
  pausas y trae respaldos.

## Seguridad y mantenimiento

- Respaldos: revisa el plan de Supabase (el gratuito no incluye respaldos diarios descargables) y define
  cómo respaldar antes de cargar datos reales.
- El plan gratuito de Supabase pausa los proyectos inactivos (ver «Tarea diaria»); el plan de pago evita pausas.
- Rota `AUTH_SECRET` y la contraseña de la base si se filtran (rotar `AUTH_SECRET` cierra todas las sesiones).
- No compartas el `.env` ni las cadenas de conexión por chat ni capturas de pantalla.
- `npm audit` reporta vulnerabilidades altas en `mysql2` y `deepmerge-ts`, dependencias internas de la CLI de
  Prisma (herramienta de desarrollo, no se ejecuta en la aplicación). Revisar al actualizar Prisma.
- El bloqueo por intentos fallidos se guarda en la base de datos, por lo que funciona igual en
  funciones serverless de Vercel.
