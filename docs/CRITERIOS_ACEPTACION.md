# Criterios de aceptación y su verificación

Verificado en local contra la base real de Supabase (PostgreSQL). Falta solo la publicación en Vercel.

| # | Criterio | Cómo se verificó | Estado |
|---|---|---|---|
| 1 | Un vendedor solo consulta y registra su propia información | Navegador: Vendedor 2 y 3 no ven datos ajenos, `/gerente`, detalle de otro vendedor, `/usuarios`, `/historial` ni la pantalla de ajuste los redirigen a su panel. Las consultas filtran por `sellerId` en el servidor; registrar ignora cualquier `sellerId` enviado. Prueba de integración de aislamiento (`stats.integration.test.ts`) | ✅ |
| 2 | El gerente consulta y gestiona a todo el equipo | Navegador: panel del equipo, detalle por vendedor, metas, usuarios, ajustes e historial | ✅ |
| 3 | La fecha de registro se asigna automáticamente | La acción del servidor fija `createdAt` y el mes (hora de Costa Rica); el formulario no tiene campo de fecha. Pruebas de `period.ts` incluyen el cambio de mes a medianoche local | ✅ |
| 4 | Cada actividad incrementa solo el indicador de su tipo | Pruebas unitarias (`indicators.test.ts`) y de integración con BD real | ✅ |
| 5 | Una venta suma cantidad y acumula su monto | Pruebas unitarias y de integración; verificado en navegador (monto `150000,50` → ₡150 000,50) | ✅ |
| 6 | El panel compara avance con la meta y muestra faltante o meta alcanzada | Pruebas de `progressOf`/`statusOf`; panel verificado con datos de demostración | ✅ |
| 7 | Un ajuste de una venta de periodo cerrado cuenta en el mes actual (monto y cantidad) y guarda quién y cuándo | Prueba de integración y navegador: venta de setiembre corregida y anulada; setiembre sin cambio, octubre −1 venta y −₡450 000; historial con autor, fecha y motivo | ✅ |
| 8 | Los datos siguen disponibles tras cerrar e iniciar sesión | Contra Supabase: inicio de sesión repetido por script (gerente y vendedor) y los usuarios y datos persisten en PostgreSQL; en navegador se verificó con la base local anterior. Falta repetirlo en la URL de Vercel | ✅ local · ⏳ Vercel |
| — | Almacenamiento persistente en base de datos y acceso web | Base de datos: PostgreSQL de Supabase, verificada. Acceso web: pendiente de publicar en Vercel (ver `DESPLIEGUE.md`) | ✅ BD · ⏳ Vercel |

## Pruebas automáticas

`npm test` ejecuta pruebas de: periodos y zona horaria, indicadores y estados, ajustes (corregir/anular,
estado vigente), validadores, bloqueo por intentos, formato del historial y una prueba de integración con un
esquema temporal de PostgreSQL (Supabase) con las migraciones reales; verifica también que las tablas tengan RLS y los montos conserven 2 decimales.

## Revisión de seguridad (resumen)

- Autorización en el servidor en cada página y acción; el estado del usuario se valida contra la BD en cada petición.
- Contraseñas con bcrypt (12 rondas), mínimo 10 caracteres, bloqueo temporal tras 5 intentos fallidos.
- El login no revela si un correo existe (mensaje genérico y comparación de hash también para correos inexistentes).
- El historial nunca guarda contraseñas ni hashes.
- Cabeceras: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Base de datos: RLS activado en todas las tablas y sin permisos para la API pública de Supabase; la app se conecta con el rol del servidor.
- Entradas validadas con Zod; consultas con Prisma (parametrizadas).
- Pendiente conocido: `npm audit` marca dependencias de la CLI de Prisma (no se ejecutan en la app).
- No hay límite de intentos por dirección IP, solo por cuenta.
