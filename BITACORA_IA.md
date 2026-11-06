# Bitácora de uso de IA

## Herramientas usadas
| Herramienta | Para qué la usé |
| --- | --- |
| Claude Code | Guía paso a paso: pistas para escribir la configuración y las reglas, explicación de conceptos, pruebas de Vitest con los casos que acordamos, revisión de mis archivos y registro de ejecuciones |
| Claude (chat) | Planificación, CLAUDE.md y corrección del enunciado en Markdown |

## Prompts más importantes
### Prompt 1: [Planificación]
- **Fecha y commit:**
  > 3/11/2026
- **Texto literal:**
  > lee CLAUDE.md y docs/Reto_A.md, no escribas código aún, no realices configuraciones ni modificaciones en el repositorio. Explica concisamente que vamos a construir, que tecnologías vamos a usar y cómo se conectane entre ellas. Despues hazme 3 preguntas sobre el sistema para revisar si entiendo todo correctamente. Revisa además que CLAUDE.md esté detalladamente configurado para cumplir con el producto mínimo viable para completar los requerimientos de docs/Reto_A.md.
- **Qué obtuve:**
 > Una revisión del CLAUDE.md en el cúal hacían falta especialmente detalles importantes 1. Justificar SQL plano frente a un ORM en decisiones, justificar la elección 2. situaciones no definidas como: formato de los errores, validación de entrada, cancelar reservas ya canceladas, Disponibilidad, Quién puede consultar. 3. precisiones técnicas útiles como que bogotá no tiene horario de verano por tanto un desfase fijo de -5 horas es suficiente sin librerias. hay que documentar esa decisión. documentar el prefijo api para diferentes rutas, probar R2 específicamente en el límite.
- **Qué cambié o decidí yo:**
> Claude propone incluir los anteriores puntos en el CLAUDE.md para el producto mínimo viable , decido incluirlos todos ya que me parece indispensable especialmente el tema de el horario de Colombia y la justificación de SQL.

### Prompt 2: [Diseño de datos, punto 2]
- **Fecha y commit:**
  > 4/11/2026, sobre el commit `6556878`
- **Contexto:** antes de programar, la IA me preguntó cómo lo resolvería yo: por qué `EXCLUDE` evita los traslapes, qué columnas y restricciones tendrían las tablas, cómo cargar el esquema y dónde guardar los festivos. Esta fue mi respuesta.
- **Texto literal:**
  > 1. exclude revisa al instante a que hora llega cada peticion , evitando que se traslapen y se agregue duplicado. 2. espacio , fecha , hora de inicio , hora de fin , número de asistentes y motivo. por otro lado supongo que tendriamos una lista con los usuarios , de ellos se tomaria la foreign key de identificacion , y de el tomamos los datos de solicitante y rol. además debe contener tambien estado , pendiente , confirmada, rechazada y cancelada. , debo además traer un calendario de festivos y domingos para quitarlos. es para colombia. y ponerlos como ocupados cuando esté por fuera del espacio de 7:00 13:00 sabados y de 7:00 a 21:00 de lunes a viernes. la cantidad de estudiantes no puede ser menor que 0 , el estado no puede ser vacio. la identificación diría yo que debe ser el código que ya trae. además estudiantes no pueden reservar auditorio pero eso se hace directamente en el codigo. el resto de las reglas igual.yo creo que si guardaria la fecha con diferentes columnas. 3. podria crear un contenedor con la base de datos y ejecutarla con npm o eso creo. yo guardaría los festivos en el código, pero cuidado , son los de colombia. entonces la idea es que consigamos el calendario de colombia y usemos esos siempre. se revisa la fecha actual se hace la validación y si no es festivo continúa, sencillo.
- **Qué obtuve:** acerté en usar el código del espacio como identificador, en guardar los festivos en el código y en validar en el código que los estudiantes no reserven el auditorio. La IA me corrigió:
  - `EXCLUDE` no mira la hora de llegada: se comprueba en el momento del `INSERT`. Dos `SELECT` simultáneos pueden ver el horario libre, y el segundo `INSERT` falla gracias a `EXCLUDE`.
  - La tabla de usuarios sobra: la identificación viene de los encabezados y no hay inicio de sesión.
  - "Asistentes no menor que 0" permitiría 0; R4 exige mínimo 1 (`CHECK (asistentes >= 1)`).
  - "Estado no vacío" aceptaría cualquier texto; hace falta `CHECK (estado IN (...))`.
  - `timestamptz` ya contiene la fecha; una columna `fecha` aparte repite el dato y complica `EXCLUDE`.
  - El horario y los domingos son reglas puras del código (R2), no datos de la base de datos.
  - Los festivos son los 6 del enunciado, no el calendario completo de Colombia, y se valida la **fecha de la reserva**, no la fecha actual.
- **Qué cambié o decidí yo:**
  > Decidí no crear una tabla de usuarios, guardar el rol como historial (la IA me mostró que ninguna regla lo lee, porque usan el rol del encabezado), guardar la fecha como columna generada para que nunca contradiga a `inicio`, y cargar los datos con un script de npm que se puede repetir. La IA escribió `schema.sql` y yo escribo `datos.sql`.

### Prompt 3: [R6, qué significa "30 días"]
- **Fecha y commit:**
  > 4/11/2026, antes del commit `4578323`
- **Contexto:** la IA redactó la pregunta del correo al evaluador sobre R6 diciendo que contaba los días "como 30 × 24 horas".
- **Texto literal:**
  > 30 × 24 horas este por ejemplo tampoco lo entiendo
- **Qué obtuve:** un ejemplo concreto: si solicito el 4/11 a las 3:00 p. m., ¿puedo reservar el 4/12 a las 6:00 p. m.? Con horas exactas (720 h) no; contando el día completo, sí. La IA reconoció que antes había dicho que "30 × 24 horas da lo mismo que 30 días de calendario", lo cual era impreciso justo en el último día.
- **Qué cambié o decidí yo:**
  > Decidí contar 720 horas exactas y que los límites exactos (24 h y 30 días) son válidos. Reescribí con mis palabras las preguntas del correo y lo envié.

### Prompt 4: [R1, qué datos recibe la regla]
- **Fecha y commit:**
  > 4/11/2026, antes del commit `0be7696`
- **Contexto:** la IA propuso un tipo `ReservaExistente` con solo `inicio`, `fin` y `estado`.
- **Texto literal:**
  > no vamos a incluir en este tipo el esquema completo de reservas? no es necesario?
- **Qué obtuve:** una función debe pedir solo lo que usa; con el esquema completo cada prueba tendría que inventar datos que R1 no mira. TypeScript compara la forma de los objetos (tipado estructural), así que una reserva completa también sirve donde se pide `ReservaExistente`. Me propuso `EstadoReserva` con los 4 valores en vez de `string`.
- **Qué cambié o decidí yo:**
  > Elegí el tipo pequeño con `EstadoReserva`, para que el estado se vea como en la base de datos y TypeScript detecte un estado mal escrito.

### Prompt 5: [R8, decidir por tipo o por código]
- **Fecha y commit:**
  > 4/11/2026, antes del commit `8b54b99`
- **Contexto:** la IA propuso que R8 reciba el tipo del espacio. Yo quería usar el código.
- **Texto literal:**
  > el tema de que use el tipo como retorno no me queda, pienso que si retorno el codigo evito confusiones con otras salas que tengan el mismo tipo , por que es mejor opcion el tipo entonces?
- **Qué obtuve:** estaba confundiendo lo que entra (el tipo) con lo que sale (el estado). La regla habla de "el auditorio" como clase de espacio: si un ADMINISTRATIVO crea `AUD-002`, decidir por `codigo === 'AUD-001'` lo dejaría confirmar sin aprobación.
- **Qué cambié o decidí yo:**
  > Usé el tipo y creé yo mismo `TipoEspacio` en `tipos.ts`. Escribí `r8.ts` con pistas; la primera versión comparaba `TipoEspacio` (el tipo, no el valor) con `==` y devolvía `null`.

### Prompt 6: [Ajuste del jueves, incorporarlo al plan]
- **Fecha y commit:**
  > 5/11/2026, mañana, antes del commit `8904192`
- **Contexto:** a las 8:00 llegó el correo con las reservas recurrentes. Le pasé el correo a la IA.
- **Texto literal:**
  > vamos a continuar donde lo dejamos , sin embargo hemos recibido un cambio en los requisitos del sistema, los cuales te presentaré a continuación [correo del ajuste] la idea es incluirlos en el claude.md y en el plan del sistema , el cual nos guiará para completar la ultima fase del proyecto.
- **Qué obtuve:** antes de tocar archivos, la IA me mostró qué cambiaría y me pidió confirmación. Señaló seis situaciones que el ajuste no define:
  - festivos dentro de la serie;
  - formato de la lista de errores;
  - rutas para cancelar;
  - R7 al cancelar una serie;
  - el auditorio en una serie;
  - el ESTUDIANTE que intenta crear una serie.

  También me hizo ver dos cosas:
  - el mínimo de 24 horas no necesita revisarse en las fechas 2 en adelante, porque son posteriores a la primera;
  - casi cualquier serie larga cruza un festivo (16/11, 8/12, 25/12, 1/1 y 11/1).
- **Qué cambié o decidí yo:**
  > Le pedí que escribiera los cambios con explicaciones descriptivas y un plan para terminar todo el mismo día en tres bloques de trabajo. Le pasé las respuestas del evaluador. Quedaron en `docs/Ajuste_jueves.md` y en `CLAUDE.md`: fuente de verdad, criterios nuevos (`validarReserva` única, todo o nada en una transacción, `serie_id`) y el punto 9 con casillas concretas.

### Prompt 7: [¿Lo logramos hoy? Cambiar el reparto del trabajo]
- **Fecha y commit:**
  > 5/11/2026, cerca de las 11:50, después del commit `617514d`
- **Contexto:** terminamos R5 y R7. Todas las reglas estaban probadas (57 pruebas), pero no había ningún endpoint.
- **Texto literal:**
  > osea, ya terminamos todo lo de las pruebas y empezamos con que del plan? lo logramos hoy?
- **Qué obtuve:** una respuesta honesta.
  - Con el ritmo de R5 y R7 (unas 2 horas entre las dos) no alcanzaba para unos 10 endpoints, el servicio con transacciones, la disponibilidad y las series.
  - La IA propuso repartir el trabajo según lo que pesa en la entrevista:
    - **Yo escribo** lo lógico que me pueden preguntar: `validarReserva`, `serie.ts` y el servicio que crea la reserva en una transacción.
    - **La IA escribe** lo repetitivo, explicando cada línea: los encabezados, los errores, los endpoints que repiten el patrón, el README y los curl.
- **Qué cambié o decidí yo:**
  > Acepté el reparto con una condición: lo lógico lo debo saber completamente y solo lo repetitivo o de plantilla lo hace la IA. Texto literal: "vamos con ese reparto me parece bien , procurando que lo logico que se puede preguntar lo sepa completamente pero lo que no es logico si no repetitivo o una plantilla lo hagas tu. tenemos que lograrlo hoy incluso teniendo en cuenta las mejoras del profesor o cambios"

### Prompt 8: [Punto 8 en una sola decisión y diseño de `validarReserva`]
- **Fecha y commit:**
  > 5/11/2026, mediodía
- **Contexto:** para no detenernos en cada situación no definida, la IA me presentó una tabla con 11 propuestas (de la A a la K): códigos HTTP, valor de `"regla"` en los errores que no son de regla, encabezados, cuerpo, espacio inactivo, aprobar, `GET /reservas`, disponibilidad, `POST /espacios` y series. También la firma de `validarReserva` y 6 pruebas de prioridad.
- **Texto literal:**
  > me parece bien el orden. igual algunas no cambian mucho. pienso que es mejor agruparlos en un objeto , además el espacio inactivo se revisa antes de validar reserva , responde con un 404 supongo.
- **Qué obtuve:** la IA me corrigió el 404. LAB-103 sí existe (aparece en `GET /espacios`), así que "no encontrado" confundiría al cliente. Lo correcto es 409: el recurso existe, pero su estado impide la operación. Es como un nodo de Kubernetes con `cordon`.
- **Qué cambié o decidí yo:**
  > Elegí agrupar los parámetros de `validarReserva` en un objeto y revisar el espacio inactivo en el servicio, antes de las reglas. Acepté la tabla completa ("Si a la tabla con las decisiones, me parece correcto, si a la firma de validarReserva y si a las 6 pruebas"). Quedaron como las decisiones 14 a 23 de `DECISIONES.md`.

### Prompt 9: [Cancelar la serie, paso a paso]
- **Fecha y commit:**
  > 5/11/2026, entre las 17:00 y las 18:00, antes del commit `35cb839`
- **Contexto:** la IA me dio las pistas de `cancelablesDeSerie` en 5 pasos, todos en un solo mensaje. Me perdí.
- **Texto literal:**
  > estoy algo perdido , vamos al paso a paso como generar la funcion, enfoquemonos solo en eso por ahora
- **Qué obtuve:** la IA cambió de método. Me daba un solo paso por mensaje y esperaba a que lo escribiera antes de seguir:
  1. la firma, con espacios en blanco y un `return` temporal;
  2. el permiso, con una tabla que traduce cada parte de la frase a código;
  3. el `filter`, reutilizando R7;
  4. el `map` para pasar de reservas a ids, comparado con `filter`;
  5. el caso vacío.

  En cada paso me pedía recorrer a mano una prueba concreta, por ejemplo docente2 en la prueba 5.
- **Qué cambié o decidí yo:**
  > Escribí cada paso y lo comprobé recorriendo las pruebas a mano. Al final encontré yo solo un error de lógica: dejé el `return` temporal con `ids: []`, así que la función siempre devolvía la lista vacía aunque hubiera fechas para cancelar. Lo cambié por `{ error: null, ids }` y pasaron las 81 pruebas. Aprendí que dividir una función en pasos pequeños, cada uno comprobado, me funciona mejor que recibir todas las pistas juntas.

### Prompt 10: [Preguntas de cierre de `crearReserva`: lo que no sabía]
- **Fecha y commit:**
  > 5/11/2026, 22:14, después del commit `b20c05b`
- **Contexto:** al terminar `POST /reservas`, la IA me hizo 4 preguntas: por qué va `ROLLBACK` antes de cada `return` con error, por qué `new Date()` está en el endpoint, por qué validar el cuerpo antes de `validarReserva` y qué recibe la segunda persona si se borra el `if` del código `23P01`.
- **Texto literal:**
  > 1. para cerrar la transaccion antes de salir. 2. no se 3. porque si el json está mal formado no vale la pena pasarlo a otro método. 4. recibe un error de la base de datos por el exclude pero no se cual
- **Qué obtuve:** la IA me corrigió con explicaciones concretas:
  - `new Date()` va en el endpoint para probar R6 y R7 con una hora fija, sin esperar ni cambiar el reloj.
  - El cuerpo se valida primero porque las reglas revisan el negocio y no el formato: 2.5 asistentes pasaría R4.
  - Sin el `if` del `23P01`, el error sube hasta el `throw` y la segunda persona recibe un 500 en vez del error de R1.
- **Qué cambié o decidí yo:**
  > No cambié el código, porque las preguntas eran para comprobar si lo entendía. Respondí "no se" en la pregunta 2 en vez de inventar, y estos temas quedaron para repasar antes de la entrevista.

## Respuestas incorrectas de la IA
| Qué propuso | Por qué estaba mal | Cómo lo noté | Cómo lo corregí |
| --- | --- | --- | --- |
| 3/11/2026: escribió `package.json`, `astro.config.mjs`, `tsconfig.json` y `.gitignore` justo después de que respondí las preguntas de configuración | No esperó mi decisión (paso 2 de CLAUDE.md) y siguió sin repasar mis dos respuestas incorrectas (el puerto y `npm build`) | Le pregunté por qué había creado todo sin consultarme | Borró los cuatro archivos y ahora los escribo yo con sus pistas |
| 4/11/2026: agregó una fila a `EJECUCIONES.md` sin volver a leer el archivo | Yo ya había agregado esa fila en mi commit. Quedó duplicada y pegada a la anterior porque el archivo no terminaba en salto de línea, y la tabla se rompió | La IA lo vio al revisar el resultado de su propio cambio | Dejó una sola fila con la hora y el hash correctos |
| 4/11/2026: para revisar mis tipos corrió `npx tsc --noEmit` sin preguntarme | CLAUDE.md prohíbe que la IA ejecute comandos. Además, TypeScript no está instalado como paquete aparte, y `npx` intentó descargar el paquete `tsc` de npm, que es otro paquete viejo y sin soporte, no el compilador | La IA lo informó al ver la advertencia en la salida | No se instaló nada en el proyecto (`package.json` sin cambios). Desde entonces la IA solo lee los archivos y me da los comandos |
| 4/11/2026: dijo que contar 30 días como 30 × 24 horas "da lo mismo que 30 días de calendario" porque Bogotá no tiene horario de verano | Justo el último día el resultado cambia: con horas exactas el límite es la misma hora de la solicitud; con días de calendario vale todo el día | No entendí la explicación y pedí un ejemplo; con el ejemplo se vio la diferencia | Decidí contar 720 horas exactas y lo pregunté al evaluador con el ejemplo |
| 5/11/2026: escribió los 8 casos de `tests/r5.test.ts` y solo probó "la reserva ya terminó" con CONFIRMADA | Mi `filter` tenía un error de precedencia (`PENDIENTE \|\| CONFIRMADA && fin > ahora`) que cuenta como activas las PENDIENTE pasadas. Las 8 pruebas pasaban igual | La IA lo vio al leer mi código después de que las 47 pruebas salieran en verde | Agregó la prueba 9 (2 PENDIENTE ya terminadas). La grabé fallando a las 10:58, puse los paréntesis y la grabé pasando |
| 5/11/2026: propuso un orden de prioridad con el auditorio de R5 en el primer lugar y el máximo de activas de R5 en el sexto | Mi `validarRegla5` revisa las dos partes en una sola llamada, con la firma que la misma IA había propuesto. Ese orden no se podía cumplir sin partir la función | La IA lo notó al escribir la decisión 17 | Las dos partes de R5 van primero, con el mismo argumento: dependen de quién pide y no de las horas |
| 5/11/2026: en la decisión 13 escribió que una reserva ajena responde "403 (R7)" | Contradecía la tabla de códigos aprobada después, donde R7 responde 422 | La IA lo vio al escribir la tabla de la decisión 18 | Cambió la decisión 13 a 422 y me lo informó |
| 5/11/2026: me pidió correr `npx tsc --noEmit` en R5, R7 y `validarReserva` | TypeScript no estaba instalado en el proyecto (ya estaba anotado en esta bitácora el 4/11), así que `npx` respondió "This is not the tsc command you are looking for" en vez de revisar los tipos | Lo vi yo al correrlo y le pegué la salida | Aprobé `npm install -D typescript` (commit `b8c619e`). `tsc` sin errores no imprime nada |
| 5/11/2026: para arreglar el 500 de `GET /api/espacios` (dos PostgreSQL de Windows ocupaban el 5432) propuso publicar el contenedor en el puerto 5433 | No revisó si el 5433 estaba libre: el segundo PostgreSQL de Windows ya lo ocupaba, porque su instalador le asigna el 5433 cuando el 5432 está tomado. El error siguió igual | Lo vi yo al repetir los curl: seguía `la autentificación password falló` | La IA revisó con `netstat` qué escuchaba en 5432 y 5433 y cambió el puerto a 55432, que estaba libre (commit `9c4474b`) |
| 5/11/2026: cambió el puerto con `Get-Content` y `Set-Content` de PowerShell 5.1 | PowerShell leyó `conexion.ts` con la codificación de Windows en vez de UTF-8 y dañó las tildes de los comentarios (`DÃ³nde` en vez de `Dónde`), además de agregar un carácter invisible (BOM) al inicio | La IA lo vio en el diff que mostró la herramienta después del cambio | Reescribió los dos archivos limpios y quitó el BOM antes de mi commit |
| 5/11/2026: para diagnosticar el 500 corrió `Get-Service` y `netstat` sin preguntarme | Eran comandos de solo lectura y no ejecutaban la aplicación, pero CLAUDE.md pide que la IA me dé los comandos y que yo los corra | La IA lo informó al escribir esta bitácora | Desde aquí, la IA me pide los diagnósticos también |
| 5/11/2026: me dio los curl de `POST /api/espacios` con el JSON entre comillas simples y `\"` adentro | En PowerShell 5.1 ese JSON se parte en los espacios (`"Laboratorio de pruebas"`) y `curl` respondió `Could not resolve host: de`. La IA no lo probó con un valor que tuviera espacios | Lo vi yo al correr el primer comando | Cambió los comandos a `curl.exe --% ... -d "{\"codigo\":...}"`; `--%` hace que PowerShell pase el resto tal cual |
| 5/11/2026: al crear `DECISIONES.md` dejó en la decisión 1 "si pide las rutas sin prefijo, se agrega el middleware" y no la actualizó cuando llegó la respuesta del evaluador | El documento quedó desactualizado: el evaluador ya había aceptado `/api` | La IA lo vio el 6/11 al revisar el documento antes de la entrega | Actualizó la decisión 1 con la respuesta del evaluador |
| 6/11/2026: escribió `docs/ejemplos_curl.md` con `curl` y dejó solo una nota para PowerShell, sabiendo que yo trabajo en PowerShell | En PowerShell 5.1 `curl` es un alias de `Invoke-WebRequest`. Al pegar un ejemplo salió "Falta un argumento para el parámetro 'InFile'" | Lo vi yo al pegar los ejemplos mientras probaba la guía | Primero propuso abrir `cmd`. Le pedí que funcionara en PowerShell y cambió todos los ejemplos y el README a `curl.exe --%` |

## Partes escritas sin IA
Nota: en el punto 1 escribí estos archivos yo mismo, pero con pistas de la IA. La IA no los escribió, aunque sí me dio algunos fragmentos cuando dije que no sabía.
- `package.json` (3/11/2026): estructura, `private`, `type` y los scripts `dev`, `build` y `test`. La IA me dio la palabra `node` del script `start`. El script `db` lo escribí primero como `npm run db` (un bucle infinito) y lo corregí a `docker compose up -d`.
- `astro.config.mjs` (3/11/2026): completo. Corregí el import de `defineConfig`, que va entre llaves.
- `tsconfig.json` (3/11/2026): `extends` e `include`. La IA me corrigió el `exclude` (es `dist`, no `package.json`).
- `.gitignore` (3/11/2026): con la tabla de nombres que me dio la IA.
- `docker-compose.yml` (3/11/2026): servicio, imagen, variables y volumen. La IA me dio la sintaxis de `ports`.
- Escrito por la IA a mi pedido: `tests/temporal.test.ts`, una prueba trivial que se borrará en el punto 5.
- `db/datos.sql` (4/11/2026): completo, sin ayuda. La IA solo me dio la forma del `INSERT` con varias filas.
- Script `db:cargar` de `package.json` (4/11/2026): la primera versión llamaba a psql sin pasarle ningún archivo. La IA me dio la primera mitad del comando (el esquema) y me explicó cada parte. La segunda mitad (los datos) y el `&&` los escribí yo. La IA me señaló un `>` que sobraba al final.
- Escrito por la IA y explicado parte por parte: `db/schema.sql`. El `CHECK (nombre <> '')` de `espacios` lo agregué yo como cambio sin ayuda (4/11/2026, 11:05). Primero puse solo `NOT NULL`, que acepta un texto vacío.
- `src/reglas/festivos.ts` (4/11/2026): completo, sin ayuda.
- `src/reglas/tipos.ts` y `src/reglas/r3.ts` (4/11/2026): los escribí yo después de que la IA me explicó los tipos de TypeScript con un ejemplo de otra cosa (citas médicas). La IA me hizo ver dos errores: solo revisaba los minutos del inicio (lo encontré recorriendo la prueba 2 a mano) y usaba `getMinutes()` en vez de `getUTCMinutes()`.
- Escrito por la IA con los casos que acordamos: `tests/r3.test.ts`. Yo cambié el nombre de la función importada.
- Correo al evaluador (4/11/2026): la IA hizo un borrador; yo lo reescribí con mis palabras, lo dejé en 6 preguntas y lo envié.
- `src/reglas/r6.ts` (4/11/2026): completo, con pistas. La IA me hizo ver que había dejado un `const ahora = new Date()` que el parámetro tapaba (shadowing). Separé el `if` en dos para tener un mensaje por cada límite.
- Cambio sin ayuda en R6 (4/11/2026): pasar el máximo de 30 a 15 días en la función y en las pruebas. Me falló una prueba porque sumé 6 días en vez de 15 (puse el 16/11 en vez del 25/11); la IA me explicó por qué la otra prueba pasaba por casualidad. Lo deshice con `git checkout`.
- `src/reglas/r1.ts` (4/11/2026): completo, con pistas (`for...of`, `continue` y la condición de cruce que me explicó la IA).
- `src/reglas/tipos.ts` (4/11/2026): agregué `EstadoReserva`, `ReservaExistente` y `TipoEspacio`. `TipoEspacio` lo hice sin ayuda.
- `src/reglas/r4.ts` (4/11/2026): completo, sin ayuda más allá de la pista del template string.
- `src/reglas/r8.ts` (4/11/2026): con pistas. Corregí cuatro errores que me señaló la IA (`TipoEspacio` en vez de `tipo`, `==`, `pendiente` sin comillas y `return null`) y el nombre de la función, que no coincidía con las pruebas.
- Escritos por la IA con los casos que acordamos: `tests/r6.test.ts`, `tests/r1.test.ts`, `tests/r4.test.ts` y `tests/r8.test.ts`.
- `src/reglas/r2.ts` (4/11/2026): lo escribí yo con pistas fuertes. La IA me explicó cómo pasar a hora de Bogotá (restar 5 horas al instante), los minutos del día y el caso de la medianoche (fin = inicio + duración), y me dio líneas con espacios en blanco para los minutos. Errores que corregí: usé `Date.now()` en vez de `inicio` (lo noté yo), agregué un parámetro `festivos` que tapaba el import, puse mal los paréntesis de la duración, reasigné `inicio` y me faltaba el `if` de las 21:00. Los 11 casos de `tests/r2.test.ts` los propusimos entre los dos (4 son míos) y la IA escribió las pruebas.
- `src/reglas/r5.ts` y `TipoRol` en `tipos.ts` (5/11/2026): con pistas. Elegí yo `.filter(...).length`. Errores que corregí:
  - recibía `ReservaExistente` en vez de `ReservaExistente[]`. Vitest no lo detecta, porque no revisa tipos;
  - faltaba el parámetro `ahora`;
  - me faltaban los paréntesis del `||`.
- `src/reglas/r7.ts` (5/11/2026): con pistas. Primero el ADMINISTRATIVO, después el dueño y después el plazo. Errores que corregí:
  - comparaba los milisegundos contra `2` (2 ms), lo grabé fallando a las 11:42;
  - faltaba el `return null` final;
  - los mensajes de permiso y de plazo estaban cruzados.
- Decisiones mías en R7 (5/11/2026):
  - primero el permiso y después el plazo;
  - exactamente 2 horas antes es válido;
  - el ADMINISTRATIVO cancela sin plazo. Al principio dije que el plazo también le aplicaba y después cambié de opinión.
- Escritos por la IA con los casos que acordamos: `tests/r5.test.ts`, `tests/r7.test.ts` y `tests/validar.test.ts`.
- `src/reglas/validar.ts` (5/11/2026): con pistas. La IA me dio la firma y la primera llamada como ejemplo del patrón `let error` / `if (error) return error`; el resto lo escribí yo. En el tipo de la solicitud corregí que me faltaba `asistentes`, que `espacio` era solo el tipo y que sobraba `solicitante`.
- `src/reglas/serie.ts` (5/11/2026): con pistas, paso por paso. La IA me desglosó `validarFechasSerie` en 7 pasos sin darme la solución. Errores que corregí:
  - `generarFechas` empezaba en `i = 1` y perdía la primera fecha;
  - `validarSerie` no revisaba que las semanas fueran enteras;
  - en la copia de la solicitud puse `solicitud` sin `...` (quedaba anidada) y `omitirR6` copiado de la original;
  - llamaba a `validarReserva` con `new Date()` en vez de `ahora`.

  Elegí escribir la copia campo por campo en vez de usar spread: si el tipo cambia, TypeScript avisa. Escritos por la IA con los casos que acordamos: `tests/serie.test.ts`.
- `cancelablesDeSerie` en `src/reglas/serie.ts` (5/11/2026, commit `35cb839`): la escribí paso a paso con pistas. La IA no me dio el código de ningún paso. Errores que corregí:
  - el tipo de retorno `ids: []` (una lista que siempre está vacía) en vez de `number[]`;
  - un `import { nullish } from 'astro:schema'` que agregó solo el autocompletado del editor y que habría roto todas las pruebas de `serie.ts`;
  - **sin ayuda:** el `return` final devolvía `ids: []` y no la lista calculada.

  Las 6 pruebas de `tests/cancelar-serie.test.ts` las escribió la IA con los casos que acordamos, y también el JSDoc de la función.
- Comentarios del código en `src/reglas/` (5/11/2026): los escribió la IA a mi pedido (commit `1207ab1` y el de `serie.ts`). Son JSDoc por función con la referencia a cada decisión y comentarios en las líneas donde el porqué no es obvio. No cambian el código.
- `crearReserva` en `src/servicios/reservas.ts` (5/11/2026, commit `b20c05b`): **no es un trabajo sin IA.** La armé paso a paso con plantillas de la IA con espacios en blanco: yo completé los valores (`BEGIN`, `COMMIT`, `ROLLBACK`, `release`, los datos de cada llamada y el código de regla) y la IA escribió el resto de la estructura, incluidos los mensajes y el `catch` del `23P01`. Errores que corregí: pegué el bloque fuera de la función, no guardé el archivo y dejé dos `catch` al pegar el último paso.

### Escrito por la IA, con mi revisión
Lo aprobé y lo probé con curl, pero no lo escribí. La IA me explicó cada parte y sigo repasándolo para la entrevista:
- `src/db/conexion.ts`, `src/db/espacios.ts` y `src/db/reservas.ts`.
- `src/pages/api/_http.ts`, `src/pages/api/reservas/_cuerpo.ts` y todos los endpoints de `src/pages/api/`.
- En `src/servicios/reservas.ts`: `crearSerie`, `enTransaccion`, `cancelarReserva`, `decidirReserva` y `cancelarSerie`.
- `src/servicios/espacios.ts`, `src/reglas/disponibilidad.ts` y `tests/disponibilidad.test.ts`.
- `README.md`, `docs/ejemplos_curl.md` y la redacción de `DECISIONES.md`. Las decisiones las tomé yo a partir de las opciones que me presentó la IA, y varias propuestas las acepté como venían.

## Qué aprendí
- `output: 'server'` y `adapter`: el primero hace que Astro atienda cada petición en el momento; el segundo define el runtime donde corre (Node, Vercel...). Aplicado en `astro.config.mjs`.
- `npm run build` solo compila en `dist/`; `npm start` corre lo compilado; `npm run dev` levanta un servidor que se recarga al guardar.
- `dependencies` frente a `devDependencies`: Vitest solo hace falta para desarrollar (`npm install -D`).
- Exportaciones con nombre (`import { defineConfig }`) frente a la exportación por defecto (`import node`).
- Docker Compose: PostgreSQL usa el puerto 5432; los datos persisten en un volumen; las variables `POSTGRES_*` solo se aplican con el volumen vacío y para cambiarlas hay que usar `docker compose down -v`.
- `EXCLUDE` frente a un `SELECT` previo: dos peticiones simultáneas pueden ver el horario libre con el `SELECT`; `EXCLUDE` se comprueba en el `INSERT` y el segundo falla. El rango `[inicio, fin)` permite reservas contiguas.
- `CHECK` debe expresar la regla exacta: `asistentes >= 1` y `estado IN (...)`, no "mayor que 0" ni "no vacío".
- Columna generada frente a columna normal: la generada la calcula PostgreSQL y no puede contradecir a `inicio`.
- `psql -v ON_ERROR_STOP=1`: sin esta opción psql sigue después de un error y termina con código 0. `<` envía un archivo como entrada y `>` escribe la salida en un archivo.
- TypeScript: anotaciones de tipo (`: number`), `type` para describir la forma de un objeto, `| null` para "esto o nada", `export` e `import type`. TypeScript también deduce los tipos solo (inferencia).
- `getMinutes()` depende de la zona horaria del computador; `getUTCMinutes()` no. Como Bogotá está a −5 horas exactas, los minutos UTC coinciden con los de Bogotá.
- Recorrer el código a mano con los datos de una prueba sirve para encontrar errores sin ejecutarlo.
- La hora actual entra como parámetro (`ahora: Date`) para que las pruebas fijen el instante; `new Date()` solo va en los endpoints. Si una variable de afuera y un parámetro se llaman igual, se usa el parámetro (shadowing).
- `getTime()` devuelve milisegundos desde el 1/1/1970 UTC; dividir entre `1000 * 60 * 60` da horas.
- Las pruebas de límite van en pares: justo en el borde y 1 ms después. Una prueba que pasa no demuestra que esté bien escrita.
- Sin `-05:00`, una fecha se interpreta en la zona del servidor: en un servidor UTC queda 5 horas antes.
- Dos reservas `[inicio, fin)` se cruzan si cada una empieza antes de que la otra termine: `inicio < otra.fin && fin > otra.inicio`.
- Tipos de unión (`'PENDIENTE' | 'CONFIRMADA' | ...`): solo aceptan esos valores. Los tipos desaparecen al ejecutar, así que no validan los datos que llegan de afuera.
- Una regla debe decidir por el dato correcto: R8 por el tipo del espacio, no por su código.
- Para obtener la hora de Bogotá se mueve el instante completo (`new Date(inicio.getTime() - 5 h)`) y luego se usan los métodos `getUTC...`; restar 5 a la hora no cambia el día. Comparar horas como minutos del día (`hora * 60 + minutos`) simplifica las condiciones, y calcular el fin como inicio + duración evita que la medianoche cuente como 0.
- `===` compara sin convertir tipos; `==` sí convierte. `toBe` compara valores simples y `toEqual` objetos completos. Los template strings (`` `El espacio ${codigo}` ``) arman textos con valores.
- `.filter(...)` devuelve un arreglo con los elementos que cumplen y `.length` los cuenta. `.some(...)` solo dice si hay al menos uno (sirve para R1, no para contar en R5). Los dos recorren la lista completa sin saber cuántos elementos tiene, igual que un `for...of`.
- `&&` se evalúa antes que `||`. `A || B && C` es `A || (B && C)`, así que hay que poner paréntesis: `(A || B) && C`. Una prueba que pasa no demuestra que la condición esté bien: hay que probar cada combinación que importa.
- `npx tsc --noEmit` revisa los tipos sin generar archivos, como `terraform validate`. Vitest ejecuta el código pero no revisa los tipos, así que hacen falta los dos.
- Un `Date` es un instante: milisegundos desde 1970 en UTC, sin zona horaria. La zona solo aparece al leer la hora del día o al convertirlo en texto. `ahora` entra como parámetro para que las pruebas fijen el instante, no por la zona horaria.
- En los límites: `<` deja pasar el valor exacto y `<=` lo bloquea. Las pruebas en pares (exacto y 1 ms después) atrapan los errores de unidades, como comparar milisegundos contra horas.
- Una función de regla recibe lo que la consulta ya filtró: R1 las reservas del espacio y R5 las del solicitante. En R7 la reserva se trae por `id` sin filtrar por solicitante, para que una ajena responda R7 y no 404, y para que el ADMINISTRATIVO la encuentre.
- 404 es "no existe" y 409 es "existe, pero su estado impide la operación" (un espacio inactivo).
- El *spread* `{ ...base, campo: valor }` copia un objeto y reemplaza algunos campos, como un merge de valores en Helm.
- `.filter` se queda con algunos elementos sin cambiarlos; `.map` se queda con todos, pero transformados (`reservas.map(r => r.id)` da solo los ids). Se pueden encadenar.
- En un tipo, `[]` solo significa "lista siempre vacía"; una lista de números es `number[]`. `{ ids }` es atajo de `{ ids: ids }`.
- `&&` hace corto circuito: si la primera parte es `false`, no evalúa la segunda. Por eso el ADMINISTRATIVO pasa el permiso sin que se compare su correo.
- El autocompletado del editor puede agregar imports en silencio (`astro:schema`). Hay que revisar las primeras líneas del archivo. En la entrevista estará desactivado.
- Un `return` temporal para que la función compile ayuda a avanzar por pasos, pero hay que acordarse de reemplazarlo al final.
- Una serie de 8 semanas tiene fechas a más de 30 días: sin omitir R6 desde la segunda fecha, el ajuste no funcionaría.
- Una transacción (`BEGIN`, `COMMIT`, `ROLLBACK`) agrupa varios cambios para que se guarden todos o ninguno. `try / catch / finally` garantiza que la conexión vuelva al pool aunque algo falle.
- El mapeo de puertos de Docker (`"55432:5432"`) va de afuera hacia adentro. Si un PostgreSQL local ya ocupa el puerto, la API le habla a ese y no al contenedor.
- Las rutas de Astro salen de las carpetas: `[id]` es una parte variable de la URL y un archivo que empieza con `_` no se publica como ruta.
