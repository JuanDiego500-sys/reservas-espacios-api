# Bitácora de uso de IA

## Herramientas usadas
| Herramienta | Para qué la usé |
| --- | --- |
| Claude Code | |
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
- [Archivo o función]: qué escribí y cuándo

## Qué aprendí
- [Concepto]: qué entendí y dónde lo apliqué