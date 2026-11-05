# Decisiones técnicas

## 1. Rutas con el prefijo `/api`
- **Contexto:** el enunciado pide implementar los endpoints en `src/pages/api/`, y Astro publica esa carpeta bajo `/api`. La tabla de servicios muestra las rutas sin prefijo (`/espacios`).
- **Alternativas:**
  - aceptar el prefijo y documentarlo;
  - redirecciones en `astro.config.mjs` (`curl` no las sigue por defecto y un POST puede perder el cuerpo);
  - un middleware que reescriba `/espacios` como `/api/espacios` (más código que explicar y probar).
- **Decisión:** aceptar `/api`. Las rutas quedan `/api/espacios`, `/api/reservas`, etc. Se le preguntó al evaluador por correo; si pide las rutas sin prefijo, se agrega el middleware.

## 2. PostgreSQL 17 con una versión fija
- **Alternativas:** `postgres:latest`, `postgres:18` y `postgres:17`.
- **Decisión:** `postgres:17`.
  - `latest` puede cambiar de versión mayor sin aviso y romper la instalación en otro computador.
  - La 18 cambió la ruta donde guarda los datos (el volumen se monta distinto), y la mayoría de la documentación y los ejemplos todavía usan la 17.
  - La 17 incluye `btree_gist`, que necesita la restricción `EXCLUDE`.

## 3. Credenciales escritas en `docker-compose.yml`
- **Alternativas:** escribirlas en el compose, o un archivo `.env` con un `.env.example` que se copia antes de arrancar.
- **Decisión:** escribirlas en el compose (`reservas` / `reservas` / `reservas`). Son ficticias y solo locales, y así el evaluador levanta la base de datos con un solo comando, dentro de los 5 minutos que pide el enunciado. En un sistema real irían en un `.env` o en un gestor de secretos, nunca en el repositorio.

## 4. Zona horaria de Bogotá con un desfase fijo de `-05:00`
- **Alternativas:** una librería de fechas (date-fns-tz, Luxon), la API `Intl` de JavaScript o un desfase fijo.
- **Decisión:** desfase fijo de `-05:00`. Colombia no tiene horario de verano, así que el desfase nunca cambia, y no se agregan dependencias. Las fechas se guardan como `timestamptz` en PostgreSQL.

## 5. Sin tabla de usuarios
- **Contexto:** el enunciado no pide inicio de sesión; el solicitante y el rol llegan en los encabezados `X-Usuario` y `X-Rol`.
- **Alternativas:** una tabla `usuarios` con llave foránea desde `reservas`, o guardar el correo del solicitante como texto en la reserva.
- **Decisión:** guardar el correo como texto (`solicitante`). Una tabla de usuarios obligaría a cargarlos, validarlos y mantenerlos sin que ninguna regla lo necesite. Si después hubiera inicio de sesión real, se agregaría la tabla.

## 6. Festivos como constante en el código
- **Alternativas:** una tabla `festivos` en PostgreSQL, una librería con el calendario de Colombia o una constante en `src/reglas/`.
- **Decisión:** una constante con los 6 festivos del enunciado. R2 queda como una función pura que se prueba sin base de datos. No se usa el calendario completo de Colombia: la fuente de verdad es el enunciado, y con el máximo de 30 días de R6 solo importan esas fechas. Se valida la fecha de la reserva, no la fecha actual.

## 7. Carga del esquema y los datos con un script de npm
- **Alternativas:** montar `db/` en `/docker-entrypoint-initdb.d` del contenedor, o un script de npm que envía `db/schema.sql` y `db/datos.sql` a `psql` dentro del contenedor.
- **Decisión:** el script de npm (`npm run db:cargar`). Se puede repetir cuando se quiera, porque borra y recrea las tablas. Con `initdb.d` los archivos solo se ejecutan la primera vez que se crea el volumen y para recargar hay que borrarlo con `docker compose down -v`.

## 8. Fecha de la reserva como columna generada
- **Contexto:** la petición trae fecha, hora de inicio y hora de fin; `inicio` y `fin` se guardan como `timestamptz`, que ya contienen la fecha.
- **Alternativas:** no guardar la fecha (se calcula en cada consulta), guardarla en una columna normal o en una columna generada.
- **Decisión:** columna generada: `fecha` = día de `inicio` en America/Bogota. PostgreSQL la calcula y nadie puede escribirla, así que nunca contradice a `inicio`. Una columna normal permitiría guardar una fecha distinta a la de `inicio`. La columna simplifica el filtro por fecha de `GET /reservas`.

## 9. Guardar el rol del solicitante en la reserva
- **Contexto:** ninguna regla lee el rol guardado: R5, R7 y R8 usan el rol de quien hace la petición (encabezado `X-Rol`), y R5 cuenta las reservas activas por correo.
- **Alternativas:** guardarlo o no guardarlo.
- **Decisión:** guardarlo como historial, para saber con qué rol se pidió cada reserva y poder analizarlo más adelante. Solo cuesta una columna con un `CHECK`.

## 10. Qué cuenta como reserva activa en R5
- **Contexto:** R5 limita a los estudiantes a "máximo 2 reservas activas a la vez", pero el enunciado no define "activa".
- **Alternativas:**
  - contar solo por estado (PENDIENTE o CONFIRMADA);
  - contar por estado y además que la reserva no haya terminado (`fin > ahora`).
- **Decisión:** estado PENDIENTE o CONFIRMADA y `fin > ahora`. Una reserva que ya pasó sigue en CONFIRMADA en la base de datos, porque nadie le cambia el estado; si se contara solo por estado, un estudiante con dos reservas pasadas quedaría bloqueado para siempre. Una reserva que termina exactamente en `ahora` ya no cuenta. El límite es por estudiante en todos los espacios: el servicio consulta las reservas del solicitante y la regla recibe esa lista. Si ya tiene 2 activas, la tercera se rechaza.

## 11. Cancelar una reserva que ya está CANCELADA o RECHAZADA
- **Contexto:** R7 dice quién puede cancelar y hasta cuándo, pero no qué pasa si la reserva ya no está activa.
- **Alternativas:**
  - incluirlo en R7 y responder con `"regla": "R7"`;
  - responder éxito sin cambiar nada (operación idempotente);
  - validarlo en el servicio, antes de R7, como un conflicto de estado.
- **Decisión:** validarlo en el servicio y responder 409. No es una regla de negocio del enunciado sino el estado actual de la reserva: cancelar algo que ya no está activo es un conflicto. Responder éxito ocultaría un posible error del cliente. R7 queda como función pura que solo revisa el permiso y el plazo.

## 12. El ADMINISTRATIVO puede cancelar sin el plazo de 2 horas
- **Contexto:** R7 dice "Solo la cancela quien la solicitó o un ADMINISTRATIVO, y hasta 2 horas antes del inicio". La frase admite dos lecturas: el plazo aplica a todos, o solo a quien la solicitó.
- **Alternativas:**
  - el plazo aplica a todos, incluido el ADMINISTRATIVO (lectura literal de la frase);
  - el ADMINISTRATIVO puede cancelar en cualquier momento.
- **Decisión:** el ADMINISTRATIVO cancela en cualquier momento; el plazo de 2 horas aplica solo al solicitante. El ADMINISTRATIVO es quien gestiona los espacios y necesita poder liberar un espacio ante una emergencia (un daño, un corte de energía, un evento institucional) aunque falten menos de 2 horas o la reserva ya haya empezado. El plazo protege a la Unidad de TI de cancelaciones de último minuto de los usuarios, no limita a la propia Unidad.
- **Consecuencia aceptada:** el ADMINISTRATIVO también puede cancelar una reserva que ya terminó. No se restringe porque agregaría una condición más sin que ninguna regla lo pida.
- **Pruebas:** "un ADMINISTRATIVO cancela a 1 hora del inicio" y "un ADMINISTRATIVO cancela una reserva que ya empezó" son válidas.

## 13. Orden y límite exacto en R7
- **Orden:** primero el permiso y después el plazo.
  - **Alternativa:** primero el plazo.
  - **Por qué:** a quien no tiene permiso no le sirve saber que "ya es tarde", porque igual no podría cancelar. Y decirle que faltan menos de 2 horas le daría información sobre la reserva de otra persona.
  - Si es ADMINISTRATIVO, la función termina ahí (decisión 12).
- **Límite exacto:** que el solicitante cancele exactamente 2 horas antes del inicio es válido.
  - **Alternativa:** que el límite fuera exclusivo.
  - **Por qué:** "hasta 2 horas antes" incluye el límite, igual que en R6, donde el evaluador confirmó que los límites exactos son válidos.
  - Una petición 1 ms después del límite se rechaza. Las dos situaciones tienen prueba.
- **Quién se compara:** el correo de `X-Usuario` frente al `solicitante` guardado en la reserva. El servicio trae la reserva por su `id`, sin filtrar por solicitante, para que una reserva ajena responda 403 (R7) y no 404.
