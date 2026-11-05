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

## Respuestas incorrectas de la IA
| Qué propuso | Por qué estaba mal | Cómo lo noté | Cómo lo corregí |
| --- | --- | --- | --- |
| 3/11/2026: escribió `package.json`, `astro.config.mjs`, `tsconfig.json` y `.gitignore` justo después de que respondí las preguntas de configuración | No esperó mi decisión (paso 2 de CLAUDE.md) y siguió sin repasar mis dos respuestas incorrectas (el puerto y `npm build`) | Le pregunté por qué había creado todo sin consultarme | Borró los cuatro archivos y ahora los escribo yo con sus pistas |
| 4/11/2026: agregó una fila a `EJECUCIONES.md` sin volver a leer el archivo | Yo ya había agregado esa fila en mi commit. Quedó duplicada y pegada a la anterior porque el archivo no terminaba en salto de línea, y la tabla se rompió | La IA lo vio al revisar el resultado de su propio cambio | Dejó una sola fila con la hora y el hash correctos |
| 4/11/2026: para revisar mis tipos corrió `npx tsc --noEmit` sin preguntarme | CLAUDE.md prohíbe que la IA ejecute comandos. Además, TypeScript no está instalado como paquete aparte, y `npx` intentó descargar el paquete `tsc` de npm, que es otro paquete viejo y sin soporte, no el compilador | La IA lo informó al ver la advertencia en la salida | No se instaló nada en el proyecto (`package.json` sin cambios). Desde entonces la IA solo lee los archivos y me da los comandos |
| 4/11/2026: dijo que contar 30 días como 30 × 24 horas "da lo mismo que 30 días de calendario" porque Bogotá no tiene horario de verano | Justo el último día el resultado cambia: con horas exactas el límite es la misma hora de la solicitud; con días de calendario vale todo el día | No entendí la explicación y pedí un ejemplo; con el ejemplo se vio la diferencia | Decidí contar 720 horas exactas y lo pregunté al evaluador con el ejemplo |

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
