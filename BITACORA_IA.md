# Bitácora de uso de IA

## Herramientas usadas
| Herramienta | Para qué la usé |
| --- | --- |
| Claude Code | Guía paso a paso del punto 1: pistas para escribir la configuración, revisión de mis archivos y registro de ejecuciones |
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

## Respuestas incorrectas de la IA
| Qué propuso | Por qué estaba mal | Cómo lo noté | Cómo lo corregí |
| --- | --- | --- | --- |
| 3/11/2026: escribió `package.json`, `astro.config.mjs`, `tsconfig.json` y `.gitignore` justo después de que respondí las preguntas de configuración | No esperó mi decisión (paso 2 de CLAUDE.md) y siguió sin repasar mis dos respuestas incorrectas (el puerto y `npm build`) | Le pregunté por qué había creado todo sin consultarme | Borró los cuatro archivos y ahora los escribo yo con sus pistas |
| 4/11/2026: agregó una fila a `EJECUCIONES.md` sin volver a leer el archivo | Yo ya había agregado esa fila en mi commit. Quedó duplicada y pegada a la anterior porque el archivo no terminaba en salto de línea, y la tabla se rompió | La IA lo vio al revisar el resultado de su propio cambio | Dejó una sola fila con la hora y el hash correctos |

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
- Escrito por la IA y explicado parte por parte: `db/schema.sql`.

## Qué aprendí
- `output: 'server'` y `adapter`: el primero hace que Astro atienda cada petición en el momento; el segundo define el runtime donde corre (Node, Vercel...). Aplicado en `astro.config.mjs`.
- `npm run build` solo compila en `dist/`; `npm start` corre lo compilado; `npm run dev` levanta un servidor que se recarga al guardar.
- `dependencies` frente a `devDependencies`: Vitest solo hace falta para desarrollar (`npm install -D`).
- Exportaciones con nombre (`import { defineConfig }`) frente a la exportación por defecto (`import node`).
- Docker Compose: PostgreSQL usa el puerto 5432; los datos persisten en un volumen; las variables `POSTGRES_*` solo se aplican con el volumen vacío y para cambiarlas hay que usar `docker compose down -v`.- `EXCLUDE` frente a un `SELECT` previo: dos peticiones simultáneas pueden ver el horario libre con el `SELECT`; `EXCLUDE` se comprueba en el `INSERT` y el segundo falla. El rango `[inicio, fin)` permite reservas contiguas.
- `CHECK` debe expresar la regla exacta: `asistentes >= 1` y `estado IN (...)`, no "mayor que 0" ni "no vacío".
- Columna generada frente a columna normal: la generada la calcula PostgreSQL y no puede contradecir a `inicio`.
- `psql -v ON_ERROR_STOP=1`: sin esta opción psql sigue después de un error y termina con código 0. `<` envía un archivo como entrada y `>` escribe la salida en un archivo.
