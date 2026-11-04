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

## Prompts más importantes
### Prompt 1: [tema]
- **Fecha y commit:**
- **Texto literal:**
  > ...
- **Qué obtuve:**
- **Qué cambié o decidí yo:**

## Respuestas incorrectas de la IA
| Qué propuso | Por qué estaba mal | Cómo lo noté | Cómo lo corregí |
| --- | --- | --- | --- |
| 3/11/2026: escribió `package.json`, `astro.config.mjs`, `tsconfig.json` y `.gitignore` justo después de que respondí las preguntas de configuración | No esperó mi decisión (paso 2 de CLAUDE.md) y siguió sin repasar mis dos respuestas incorrectas (el puerto y `npm build`) | Le pregunté por qué había creado todo sin consultarme | Borró los cuatro archivos y ahora los escribo yo con sus pistas |

## Partes escritas sin IA
Nota: en el punto 1 escribí estos archivos yo mismo, pero con pistas de la IA. La IA no los escribió, aunque sí me dio algunos fragmentos cuando dije que no sabía.
- `package.json` (3/11/2026): estructura, `private`, `type` y los scripts `dev`, `build` y `test`. La IA me dio la palabra `node` del script `start`. El script `db` lo escribí primero como `npm run db` (un bucle infinito) y lo corregí a `docker compose up -d`.
- `astro.config.mjs` (3/11/2026): completo. Corregí el import de `defineConfig`, que va entre llaves.
- `tsconfig.json` (3/11/2026): `extends` e `include`. La IA me corrigió el `exclude` (es `dist`, no `package.json`).
- `.gitignore` (3/11/2026): con la tabla de nombres que me dio la IA.
- `docker-compose.yml` (3/11/2026): servicio, imagen, variables y volumen. La IA me dio la sintaxis de `ports`.
- Escrito por la IA a mi pedido: `tests/temporal.test.ts`, una prueba trivial que se borrará en el punto 5.

## Qué aprendí
- `output: 'server'` y `adapter`: el primero hace que Astro atienda cada petición en el momento; el segundo define el runtime donde corre (Node, Vercel...). Aplicado en `astro.config.mjs`.
- `npm run build` solo compila en `dist/`; `npm start` corre lo compilado; `npm run dev` levanta un servidor que se recarga al guardar.
- `dependencies` frente a `devDependencies`: Vitest solo hace falta para desarrollar (`npm install -D`).
- Exportaciones con nombre (`import { defineConfig }`) frente a la exportación por defecto (`import node`).
- Docker Compose: PostgreSQL usa el puerto 5432; los datos persisten en un volumen; las variables `POSTGRES_*` solo se aplican con el volumen vacío y para cambiarlas hay que usar `docker compose down -v`.