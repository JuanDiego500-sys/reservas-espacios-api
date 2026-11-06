# Reservas de espacios: API REST

API para gestionar las reservas de laboratorios, salas y el auditorio. Hace cumplir las reglas R1 a R8 del reto y permite crear reservas recurrentes semanales.

**Stack:** Astro en modo servidor (`@astrojs/node`), TypeScript, PostgreSQL 17 con Docker Compose, SQL plano con `pg` y Vitest.

## Requisitos

- Node.js 22.23.4 o superior (lo exige Astro 7). Revísalo con `node -v`.
- Docker Desktop **iniciado**.

## Instalar y ejecutar

```bash
git clone <url-del-repositorio>
cd reservas-espacios-api
npm install
npm run db          # levanta PostgreSQL en un contenedor
npm run db:cargar   # crea las tablas y carga los 7 espacios
npm run dev         # levanta la API en http://localhost:4321
```

- `npm run db:cargar` **borra todo y lo crea de nuevo**, así que sirve también para reiniciar los datos.
- Si responde que la base todavía está iniciando, espera 5 segundos y repítelo.

## Correr las pruebas

```bash
npm test
```

Son 86 pruebas de las reglas. No necesitan la base de datos ni la API, porque las reglas son funciones puras y la hora actual les llega como parámetro.

## Probar que funciona

Con `npm run dev` corriendo, en otra terminal:

```bash
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" http://localhost:4321/api/espacios
```

Debe responder `200` con los 7 espacios. En PowerShell escribe `curl.exe --%` en lugar de `curl`.

El recorrido completo está en [docs/ejemplos_curl.md](docs/ejemplos_curl.md).

## Rutas

Todas las rutas llevan el prefijo **`/api`**, porque Astro publica así los endpoints de `src/pages/api/`. El evaluador aceptó este prefijo.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/api/espacios?tipo=LAB` | Lista los espacios; `tipo` es opcional |
| POST | `/api/espacios` | Crea un espacio (solo ADMINISTRATIVO) |
| GET | `/api/espacios/{codigo}/disponibilidad?fecha=AAAA-MM-DD` | Bloques de 30 minutos libres |
| POST | `/api/reservas` | Crea una reserva |
| GET | `/api/reservas?espacio=&fecha=&solicitante=&estado=` | Consulta con filtros opcionales |
| POST | `/api/reservas/{id}/cancelar` | Cancela una reserva o una sola fecha de una serie |
| POST | `/api/reservas/{id}/aprobar` | Aprueba una reserva pendiente (solo ADMINISTRATIVO) |
| POST | `/api/reservas/{id}/rechazar` | Rechaza una reserva pendiente (solo ADMINISTRATIVO) |
| POST | `/api/reservas/recurrentes` | Crea una serie semanal de 2 a 16 semanas (DOCENTE o ADMINISTRATIVO) |
| POST | `/api/reservas/series/{serieId}/cancelar` | Cancela las fechas de la serie que todavía se pueden cancelar |

## Identificación

No hay inicio de sesión. **Todas** las peticiones, también los GET, deben traer dos encabezados:

- `X-Usuario`: un correo.
- `X-Rol`: `ESTUDIANTE`, `DOCENTE` o `ADMINISTRATIVO`, exactamente así, en mayúsculas.

Usuarios de prueba (ficticios):

| Correo | Rol |
| --- | --- |
| `estudiante1@ejemplo.edu.co`, `estudiante2@ejemplo.edu.co` | ESTUDIANTE |
| `docente1@ejemplo.edu.co`, `docente2@ejemplo.edu.co` | DOCENTE |
| `admin1@ejemplo.edu.co` | ADMINISTRATIVO |

## Cuerpo de una reserva

```json
{
  "espacio": "LAB-101",
  "fecha": "2026-11-25",
  "inicio": "08:00",
  "fin": "10:00",
  "asistentes": 20,
  "motivo": "Clase de redes"
}
```

Para una serie, se agrega `"semanas": 4`. Las horas se interpretan en America/Bogota.

## Errores

Todos los errores tienen el mismo formato:

```json
{"regla": "R4", "mensaje": "El espacio LAB-201 admite máximo 20 asistentes"}
```

| HTTP | `regla` | Cuándo |
| --- | --- | --- |
| 400 | `VALIDACION` | Cuerpo, parámetros o número de semanas inválidos |
| 401 | `IDENTIFICACION` | Encabezados ausentes o inválidos |
| 403 | `PERMISO` | La acción es solo para ADMINISTRATIVO |
| 403 | `SERIE` | Un ESTUDIANTE intenta crear una serie |
| 404 | `NO_ENCONTRADO` | El espacio, la reserva o la serie no existe |
| 409 | `CONFLICTO` | Espacio inactivo, código duplicado o estado que no permite la acción |
| 409 | `R1` | Traslape con otra reserva activa |
| 422 | `R2` a `R7` | Se incumple esa regla de negocio |
| 422 | `SERIE` | Alguna fecha de la serie incumple una regla; no se crea ninguna |

Cuando una serie falla, la respuesta lista cada fecha con su problema:

```json
{
  "regla": "SERIE",
  "mensaje": "No se creó la serie: 1 de 2 fechas incumplen una regla",
  "fechas": [{"fecha": "2026-12-08", "regla": "R2", "mensaje": "..."}]
}
```

## Estructura

```text
src/pages/api/   Endpoints delgados: leen la petición y devuelven la respuesta
src/servicios/   Casos de uso: coordinan reglas, base de datos y transacciones
src/reglas/      Funciones puras: sin base de datos, sin HTTP y sin new Date()
src/db/          Conexión y consultas SQL
db/              schema.sql y datos.sql
tests/           Pruebas de Vitest
docs/            Enunciado, ajuste del jueves y ejemplos curl
```

## Si algo falla

- **`docker compose` no se puede conectar:** Docker Desktop no está iniciado.
- **Puerto ocupado:** la base usa el puerto **55432** de tu computador para no chocar con un PostgreSQL instalado localmente, y la API usa el 4321. La conexión se puede cambiar con la variable de entorno `DATABASE_URL`.
- **Empezar desde cero:** `docker compose down -v` borra el contenedor y sus datos. Luego repite `npm run db` y `npm run db:cargar`.
- **Una reserva responde `R6` en los ejemplos:** R6 depende de la fecha de hoy. Usa una fecha entre 24 horas y 30 días hacia adelante.

## Documentos

- [DECISIONES.md](DECISIONES.md): decisiones técnicas, alternativas y situaciones que el enunciado no define.
- [BITACORA_IA.md](BITACORA_IA.md): cómo usé la IA, prompts, errores y partes escritas sin IA.
- [EJECUCIONES.md](EJECUCIONES.md): una fila por grabación.
- [docs/ejemplos_curl.md](docs/ejemplos_curl.md): colección de peticiones.
