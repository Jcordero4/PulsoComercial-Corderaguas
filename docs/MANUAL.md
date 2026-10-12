# Manual de usuario — Pulso Comercial Corderaguas

## Para vendedores

**Entrar:** con tu correo y contraseña. Tras 5 intentos fallidos el acceso se bloquea 15 minutos;
gerencia puede desbloquearte antes.

**Registrar una actividad** (menú *Registrar*):
1. Elige el **tipo**: llamada, visita, reunión, cotización, venta o seguimiento.
2. Elige el **cliente** (si no existe, créalo antes en *Clientes* con nombre y empresa).
3. Si es una **venta**, escribe el monto en colones (ej. `150000` o `150000,50`).
4. Agrega una nota breve si quieres y pulsa *Registrar*.

La fecha se pone sola al guardar y el registro cuenta para el **mes en que lo haces**. No se puede
elegir una fecha anterior.

**Ver tu avance** (*Mi avance*): ventas del mes, monto vendido, y para cada indicador tu avance,
tu meta, el faltante y un estado:

| Estado | Significa |
|---|---|
| ✔ Meta alcanzada | Ya llegaste a la meta del mes |
| ● Al día | Tu avance va igual o mejor que el ritmo esperado del mes |
| ▲ Por debajo | Tu avance va menos que el ritmo esperado |
| — Sin meta | Gerencia aún no definió meta para ese indicador |

El ritmo esperado es la fracción del mes transcurrida. Por ejemplo, el día 15 de un mes de 30 días
se espera haber cumplido la mitad de la meta.

**Mis actividades** muestra solo lo tuyo. Si gerencia corrige o anula un registro, verás
*Corregido* o *Anulado* junto a él. No puedes ver información de tus compañeros.

## Para gerentes

**Panel del equipo** (*Inicio*): elige mes y año. Verás cuántas metas están alcanzadas, al día o por
debajo, una gráfica de avance por indicador y vendedor, y la tabla de vendedores (con sus registros del
mes para detectar bajo registro). Pulsa el nombre de un vendedor para ver su detalle y sus actividades.

**Metas** (*Metas*): elige el mes, el vendedor, el indicador y el valor objetivo. Si ya existe esa meta,
se reemplaza. Los indicadores son: llamadas, visitas, reuniones, cotizaciones, ventas (cantidad),
seguimientos y ventas (monto en ₡). Las metas de cantidad deben ser números enteros.

**Usuarios** (*Usuarios*): crear vendedores y gerentes (contraseña inicial de al menos 10 caracteres),
desactivar o activar, cambiar la contraseña y desbloquear a quien se bloqueó por intentos fallidos.
Un usuario desactivado pierde el acceso de inmediato. No puedes desactivarte a ti mismo ni dejar al
sistema sin gerentes activos.

**Corregir o anular un registro** (*Actividades* → *Corregir / anular*):
- **Corregir:** cambia el monto de una venta o el tipo de la actividad. Indica el motivo.
- **Anular:** resta el registro del avance. Indica el motivo y confirma.
- El registro original **nunca se modifica**. El cambio se cuenta en el **mes actual**: si corriges una
  venta de un mes ya cerrado, ese mes no cambia y el ajuste de cantidad y monto aparece este mes.
- Un registro anulado no admite más cambios.

**Historial** (*Historial*): quién cambió qué y cuándo (antes → después y motivo) en clientes, metas,
usuarios y actividades.

## Al configurar el sistema con datos reales

Los usuarios `Vendedor 1-3` y `Gerente 1-2` son de ejemplo. Crea los usuarios reales en *Usuarios*,
desactiva los de ejemplo y cambia las contraseñas iniciales. No dejes cuentas de ejemplo activas en
producción.
