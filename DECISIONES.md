# Decisiones técnicas

## 1. Rutas con el prefijo `/api`
- **Contexto:** el enunciado pide implementar los endpoints en `src/pages/api/`, y Astro publica esa carpeta bajo `/api`. La tabla de servicios muestra las rutas sin prefijo (`/espacios`).
- **Alternativas:**
  - aceptar el prefijo y documentarlo;
  - redirecciones en `astro.config.mjs` (`curl` no las sigue por defecto y un POST puede perder el cuerpo);
  - un middleware que reescriba `/espacios` como `/api/espacios` (más código que explicar y probar).
- **Decisión:** aceptar `/api`. Las rutas quedan `/api/espacios`, `/api/reservas`, etc. Se le preguntó al evaluador por correo y respondió que está bien, indicándolo en el README y en la documentación de la API.

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
- **Quién se compara:** el correo de `X-Usuario` frente al `solicitante` guardado en la reserva. El servicio trae la reserva por su `id`, sin filtrar por solicitante, para que una reserva ajena responda 422 (R7) y no 404.

## 14. SQL plano con `pg` en lugar de un ORM
- **Alternativas:** un ORM (Prisma, Drizzle), un constructor de consultas (Kysely) o SQL plano con el paquete `pg`.
- **Decisión:** SQL plano con `pg`.
  - Las reglas más delicadas viven en PostgreSQL (`EXCLUDE` con `tstzrange`, columna generada con `AT TIME ZONE`, `CHECK`). Con un ORM habría que escribirlas igual en SQL crudo o en migraciones aparte.
  - Con SQL plano, lo que se lee en `schema.sql` y en las consultas es exactamente lo que corre en la base de datos. No hay una capa que traducir ni que explicar en la entrevista.
  - Son dos tablas y unas diez consultas: un ORM agregaría dependencias, generación de código y configuración sin ahorrar trabajo.
  - **Costo aceptado:** los resultados de las consultas no traen tipos automáticos. Se escriben a mano en TypeScript. Las consultas siempre usan parámetros (`$1`, `$2`), nunca texto concatenado, para evitar la inyección de SQL.

## 15. Cómo se cuentan los 30 días de R6
- **Contexto:** el evaluador confirmó que los dos límites exactos (24 horas y 30 días) son válidos y dejó a nuestra decisión cómo contar los 30 días.
- **Alternativas:**
  - 720 horas exactas (30 × 24) desde `ahora` hasta el inicio;
  - 30 días de calendario en Bogotá, comparando solo las fechas sin importar la hora.
- **Decisión:** 720 horas exactas. Usa la misma unidad que el mínimo de 24 horas, así que las dos mitades de la regla se calculan igual (diferencia de `getTime()` en horas). Como Bogotá no tiene horario de verano, 30 días siempre son 720 horas. Una reserva que empieza exactamente 720 horas después es válida, y 1 ms más tarde se rechaza. Las dos situaciones tienen prueba.

## 16. R8 decide por tipo de espacio y no por código
- **Alternativas:** comparar el código (`AUD-001`) o el tipo (`AUDITORIO`).
- **Decisión:** por tipo. Si se crea otro auditorio con `POST /espacios`, también queda PENDIENTE sin cambiar el código. Lo mismo aplica a R5: el estudiante no puede reservar ningún espacio de tipo AUDITORIO.

## 17. Prioridad cuando se incumplen varias reglas
- **Contexto:** una petición puede incumplir varias reglas a la vez; el formato de error tiene una sola `"regla"`.
- **Alternativas:** devolver todos los errores o devolver solo el primero en un orden fijo.
- **Decisión:** el primero en este orden. Antes de las reglas van los encabezados (401), el cuerpo (400), la existencia del espacio (404) y que esté activo (409). Después, la función `validarReserva` revisa:
  1. **R5:** auditorio y máximo de reservas activas. Depende de quién pide y no se arregla cambiando las horas de la petición.
  2. **R3:** bloques y duración. Si las horas están mal formadas, no tiene sentido revisar el horario.
  3. **R2:** horario, domingos y festivos.
  4. **R6:** anticipación. Se omite en las fechas 2 en adelante de una serie.
  5. **R4:** capacidad.
  6. **R1:** traslape. Va al final porque depende de las demás reservas del espacio, que cambian todo el tiempo, y PostgreSQL la vuelve a revisar con `EXCLUDE`.
- Un solo error por respuesta mantiene el formato del enunciado y hace que cada prueba verifique exactamente una regla.

## 18. Códigos HTTP y valor de `"regla"` en todos los errores
- **Contexto:** el enunciado fija el formato `{"regla", "mensaje"}` para las reglas, pero no dice qué hacer con los demás errores.
- **Alternativas:** un formato distinto para los errores que no son de regla (por ejemplo `{"error": ...}`), o el mismo formato con un valor descriptivo en `"regla"`.
- **Decisión:** el mismo formato siempre, para que el cliente lea los errores de una sola forma.

| Situación | HTTP | `"regla"` |
| --- | --- | --- |
| Encabezados `X-Usuario` o `X-Rol` ausentes, correo sin `@` o rol inválido | 401 | `IDENTIFICACION` |
| Cuerpo inválido: campos faltantes, fecha que no es `AAAA-MM-DD` real, hora que no es `HH:MM`, asistentes no enteros, motivo vacío, tipo de espacio inválido, `semanas` no entero o fuera de 2 a 16 | 400 | `VALIDACION` |
| La acción es solo para ADMINISTRATIVO (crear espacio, aprobar, rechazar) | 403 | `PERMISO` |
| ESTUDIANTE que intenta crear una serie | 403 | `SERIE` |
| Espacio o reserva que no existe | 404 | `NO_ENCONTRADO` |
| Espacio inactivo, código duplicado, estado que no permite la acción | 409 | `CONFLICTO` |
| R1 (traslape) | 409 | `R1` |
| R2, R3, R4, R5, R6 y R7 | 422 | la regla |
| Alguna fecha de una serie incumple una regla | 422 | `SERIE`, con la lista `fechas` |

- **Por qué 409 en R1 y 422 en el resto:** R1 choca con el estado actual de otro recurso, la otra reserva. Las demás indican que la petición está bien formada pero no cumple una regla del negocio.
- **Por qué validar el cuerpo antes de las reglas:** por ejemplo, 2.5 asistentes pasaría R4 (está entre 1 y la capacidad); se rechaza antes con `VALIDACION`.

## 19. Espacio inactivo
- **Alternativas:** 404 (como si no existiera), 422 como una regla más o 409.
- **Decisión:** 409 `CONFLICTO`. El espacio existe (aparece en `GET /espacios`), pero su estado impide reservarlo, así que 404 confundiría al cliente. Se revisa en el servicio antes de `validarReserva`, porque el dato viene de la base de datos y no es una regla del enunciado.

## 20. Aprobar, rechazar y estados
- Aprobar o rechazar una reserva que no está PENDIENTE → 409 `CONFLICTO`.
- Aprobar una reserva cuyo inicio ya pasó → 409 `CONFLICTO`: confirmar algo que ya ocurrió no tiene sentido. Rechazarla sí se permite, para que no quede PENDIENTE para siempre.
- **Alternativa descartada:** permitir aprobar siempre. Dejaría reservas "confirmadas" en el pasado sin que nadie las usara.

## 21. Quién puede consultar `GET /reservas`
- **Alternativas:** todos los roles ven todas las reservas, o el ESTUDIANTE y el DOCENTE ven solo las suyas.
- **Decisión:** todos ven todas. El enunciado ofrece el filtro por solicitante y no pide privacidad. Ver las reservas de otros ayuda a encontrar un horario libre. En un sistema real se restringiría, porque los correos son datos personales.

## 22. Disponibilidad
- **Decisión:** los bloques de 30 minutos libres se calculan solo con el horario (R2) y las reservas activas (R1). No se aplica R6: la disponibilidad describe el calendario del espacio, no si quien consulta puede reservar ya. Si se aplicara R6, la respuesta cambiaría según la hora de la consulta.
- **Domingo o festivo:** lista vacía (200).
- **Espacio inactivo:** 409, igual que al reservar.
- **Fecha pasada:** se calcula igual.
- **Alternativa descartada:** devolver error en domingos y festivos. Una lista vacía responde la pregunta "¿qué hay libre?" sin tratarla como un error.

## 23. Crear espacios
- Código duplicado → 409 `CONFLICTO` (la llave primaria de PostgreSQL lo garantiza aunque lleguen dos peticiones a la vez).
- Tipo distinto de LAB, SALA o AUDITORIO → 400 `VALIDACION`. El `CHECK` de `schema.sql` es la segunda barrera.
- Capacidad: entero mayor que 0. `activo` es opcional y vale `true` por defecto.

## 24. Reservas recurrentes: cómo se validan las fechas
- **Contexto:** el ajuste del jueves pide series semanales de 2 a 16 semanas, "todo o nada", que deben cumplir las mismas reglas.
- **Alternativas:**
  - escribir una validación aparte para las series;
  - usar una sola función para todas las reservas.
- **Decisión:** una sola función pura, `validarReserva`. `POST /reservas` la llama una vez y `POST /reservas/recurrentes` la llama una vez por semana. Si una regla cambia, se cambia en un solo lugar.
- `generarFechas` suma 7 días a inicio y fin. Basta con sumar milisegundos porque Bogotá no tiene horario de verano (decisión 4).

## 25. Todo o nada en una transacción
- **Alternativas:**
  - insertar fecha por fecha y borrar lo creado si una falla;
  - validar todas las fechas primero e insertar después, en una sola transacción;
  - crear las fechas válidas y saltarse las que fallan.
- **Decisión:** validar primero e insertar después, dentro de `BEGIN` y `COMMIT`. Si alguna fecha falla, se hace `ROLLBACK`, no se inserta ninguna y se responde la lista completa. Si dos peticiones chocan justo al insertar, `EXCLUDE` rechaza la segunda y el `ROLLBACK` deshace toda su serie.
- **Festivos:** una fecha en festivo rechaza toda la serie. Saltarla contradiría el "si alguna fecha incumple una regla, no se crea ninguna" del ajuste.
- **Consecuencia aceptada:** casi cualquier serie larga cruza un festivo (16/11, 8/12, 25/12, 1/1 y 11/1). El cliente lo ve en la lista y puede ajustar el día o las semanas.

## 26. Formato de la respuesta cuando una serie falla
- **Alternativas:**
  - todos los errores de cada fecha;
  - solo el primer error de cada fecha, en el orden de la decisión 17;
  - solo la primera fecha que falla.
- **Decisión:** `{"regla": "SERIE", "mensaje": "...", "fechas": [{"fecha", "regla", "mensaje"}]}`, con 422 y el primer error de cada fecha. Se recorren todas las fechas porque el ajuste pide listar cada una con su problema. Usar el primer error de cada fecha reutiliza `validarReserva` sin cambiarla y mantiene el formato de un error por regla.
- **Caso aparte:** si `EXCLUDE` rechaza la serie porque otra petición llegó al mismo tiempo, se responde 409 `R1` sin la lista, porque PostgreSQL no indica de forma simple cuál fecha chocó.

## 27. R6 en las series
- **Decisión:** R6 completa (mínimo 24 horas y máximo 30 días) se aplica a la primera fecha. Las demás usan `omitirR6: true`.
  - El máximo de 30 días lo quita el ajuste.
  - El mínimo de 24 horas se cumple solo, porque las demás fechas son posteriores a la primera.
- **Alternativa descartada:** seguir revisando el mínimo en cada fecha. Sería una condición que nunca falla.

## 28. Vínculo entre las reservas de una serie
- **Alternativas:**
  - una tabla `series` con llave foránea;
  - el `id` de la primera reserva como `serie_id`;
  - `MAX(serie_id) + 1`;
  - una columna `serie_id` que toma su valor de una secuencia de PostgreSQL.
- **Decisión:** columna `serie_id` con la secuencia `series_id_seq`, nula en las reservas simples.
  - La serie no tiene datos propios, así que una tabla sobraría.
  - `MAX + 1` puede repetir el número si dos peticiones llegan al mismo tiempo.
  - El `id` de la primera reserva obligaría a insertarla y actualizarla después.
  - La secuencia entrega siempre un número único. Un `ROLLBACK` no devuelve el número y pueden quedar huecos, lo cual no importa porque es solo una etiqueta.

## 29. Quién crea series y cómo se cancelan
- **ESTUDIANTE:** 403 `SERIE`. Se revisa en `validarSerie`, antes de consultar la base de datos.
- **Semanas:** no entero o fuera de 2 a 16 → 400 `VALIDACION`. Hay pruebas con 1, 2, 16 y 17.
- **Cancelar una fecha:** `POST /reservas/{id}/cancelar`, la ruta que ya existía, con R7.
- **Cancelar la serie:** `POST /reservas/series/{serieId}/cancelar`.
- **Fechas que ya no se pueden cancelar:**
  - **Alternativas:** rechazar toda la cancelación si una fecha no se puede cancelar, o cancelar solo las que se pueden y omitir las demás.
  - **Decisión:** cancelar las que se pueden y responder `{"canceladas": [...], "omitidas": N}`. Una fecha ya pasada o a menos de 2 horas no debe impedir liberar las siguientes. El "todo o nada" del ajuste habla de crear, no de cancelar.
  - Si no queda ninguna por cancelar → 409 `CONFLICTO`. Si quien pide no tiene permiso → 422 `R7`, como al cancelar una sola fecha.
  - El ADMINISTRATIVO no tiene plazo (decisión 12), así que también puede cancelar las fechas a menos de 2 horas.

## 30. Series en el auditorio
- **Alternativas:** aprobar la serie completa con una ruta nueva, o aprobar cada fecha con las rutas existentes.
- **Decisión:** cada fecha queda PENDIENTE por R8 y se aprueba o rechaza una por una. El ajuste no pide una aprobación conjunta, y así no se agrega una ruta nueva.

## 31. Puerto 55432 para la base de datos
- **Contexto:** en mi computador hay dos PostgreSQL instalados en Windows que ocupan los puertos 5432 y 5433. La API llegaba a uno de ellos y fallaba con "la autentificación password falló".
- **Alternativas:**
  - detener los servicios locales (el README tendría que pedirle lo mismo al evaluador);
  - usar un puerto poco común, afuera del contenedor.
- **Decisión:** publicar el contenedor en el 55432 (`"55432:5432"`). Dentro del contenedor sigue siendo el 5432. Evita el mismo choque en otro computador. `DATABASE_URL` permite cambiar la conexión.

## 32. Candado `FOR UPDATE` al cambiar el estado
- **Contexto:** dos peticiones simultáneas podrían leer la misma reserva como PENDIENTE; una la aprueba y la otra la rechaza. El estado final dependería de cuál escribe de último.
- **Alternativas:** no proteger este caso; un `UPDATE ... WHERE estado = 'PENDIENTE'` que revisa las filas afectadas; o `SELECT ... FOR UPDATE` dentro de una transacción.
- **Decisión:** `FOR UPDATE`. La segunda petición espera el `COMMIT` de la primera y lee el estado nuevo, así que responde 409. Las reglas siguen en el código y no dentro del `UPDATE`.

## 33. Identificación estricta en todas las rutas
- **Alternativas:** exigir los encabezados solo en las rutas que escriben, o en todas.
- **Decisión:** en todas, incluidos los GET, porque el enunciado dice "cada petición trae los encabezados".
- **Rol:** debe ser exacto y en mayúsculas. `docente` responde 401: el enunciado define esos tres valores, y aceptar variantes sería una regla más sin que nadie la pida.
- **Correo:** solo se revisa que traiga `@`. La identificación es simulada, así que validar más no aporta seguridad.
- **Por qué 401 y no 400:** el problema es no saber quién pide, no el contenido de la petición.

## 34. Límites conocidos
Se aceptan para mantener el proyecto simple, y se dejan escritos para no ocultarlos.
- **R5 ante peticiones simultáneas:** R1 tiene `EXCLUDE`, pero el máximo de 2 reservas activas solo se revisa en el servicio. Dos peticiones simultáneas del mismo estudiante podrían dejarlo con 3. Para evitarlo haría falta un candado por solicitante. Se priorizó R1 porque un cruce deja a dos personas con el mismo espacio; una reserva de más no causa ese conflicto.
- **Identidad sin verificar:** cualquiera puede enviar `X-Rol: ADMINISTRATIVO`. Lo pide así el enunciado; en un sistema real el rol saldría de un inicio de sesión.
- **Sin paginación:** `GET /reservas` devuelve todas las filas que coinciden con los filtros. Con pocas reservas no hace falta.
