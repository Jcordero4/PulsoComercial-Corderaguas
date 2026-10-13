# Pulso Comercial Corderaguas

Seguimiento de la actividad de cada vendedor y de su avance contra metas mensuales. Los vendedores
registran actividades y ventas; gerencia ve el avance del equipo, define metas y corrige o anula
registros con historial.

- **Moneda:** colones (₡). **Zona horaria:** `America/Costa_Rica` (define a qué mes pertenece cada registro).
- **Stack:** Next.js 16 · TypeScript · Prisma 7 · Auth.js (credenciales) · Recharts · Tailwind.
- **Base de datos:** PostgreSQL en Supabase; la aplicación está publicada en Vercel
  (https://pulso-comercial-corderaguas-lt11.vercel.app, ver [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)).

## Puesta en marcha local

```bash
npm install                 # también genera el cliente de Prisma
cp .env.example .env        # completa las cadenas de Supabase, AUTH_SECRET y SEED_PASSWORD
npx prisma migrate deploy   # crea las tablas en la base de Supabase
npm run db:seed             # 2 gerentes y 3 vendedores de ejemplo
npm run dev                 # http://localhost:3000
```

Genera `AUTH_SECRET` con `npx auth secret`. `SEED_PASSWORD` (mínimo 10 caracteres) es la contraseña
inicial de los usuarios de ejemplo (`gerente1@pulso.local`, `vendedor1@pulso.local`, …).

Datos de demostración (solo para una base de pruebas, nunca en producción):
`ALLOW_DEMO_DATA=true npm run db:demo`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` / `build` / `start` | Servidor de desarrollo, compilación y producción |
| `npm test` | Pruebas unitarias y de integración (la integración usa un esquema temporal en Supabase) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crea migraciones en desarrollo (requiere base de sombra) |
| `npm run db:deploy` | Aplica las migraciones existentes |
| `npm run db:seed` / `db:demo` | Usuarios de ejemplo / datos de demostración |

## Cómo está hecho

- **Actividades inmutables.** Corregir o anular nunca edita el registro: crea un *ajuste* con deltas de
  cantidad y monto que cuenta en el **mes actual**, aunque el registro sea de un periodo cerrado. Cada
  ajuste guarda quién, cuándo y el motivo. Lógica en `src/lib/adjustments.ts`.
- **Avance** = actividades del mes + ajustes del mes (`src/lib/indicators.ts`, `src/lib/stats.ts`).
  Progreso = avance ÷ meta. Faltante = meta − avance (cero si se alcanza). Estado según el ritmo esperado
  del mes (día ÷ días del mes).
- **Permisos en el servidor.** Cada página y acción llama a `requireUser(rol)` (`src/lib/session.ts`), que
  valida contra la BD: un usuario desactivado pierde acceso de inmediato. El proxy (`src/proxy.ts`) solo
  hace redirecciones de cortesía. Un vendedor solo recibe consultas filtradas por su propio id.
- **Seguridad:** contraseñas con bcrypt, bloqueo de 15 min tras 5 intentos fallidos, mensajes de error
  que no revelan qué correos existen, cabeceras de seguridad (`next.config.ts`), validación con Zod.
- **Historial:** tabla `AuditLog` con quién/cuándo/antes/después de cambios en clientes, metas,
  usuarios y actividades (pantalla `/historial`, solo gerencia).

## Estructura

```
prisma/            esquema, migraciones, seed y datos de demostración
src/app/(app)/     pantallas autenticadas (gerente, vendedor, actividades, clientes, metas, usuarios, historial)
src/app/login/     inicio de sesión
src/lib/           reglas de negocio puras (periodos, indicadores, ajustes, bloqueo) y acceso a datos
src/components/    tablas, gráficas y piezas de interfaz compartidas
docs/              manual de usuario, despliegue y criterios de aceptación
```

## Documentación

- [Manual de usuario](docs/MANUAL.md)
- [Despliegue en Supabase y Vercel](docs/DESPLIEGUE.md)
- [Criterios de aceptación y su verificación](docs/CRITERIOS_ACEPTACION.md)

## Fuera del alcance inicial

Envío de correos, exportación de reportes e integraciones con otros sistemas.
