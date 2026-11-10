# Room Booking REST API

[![CI](https://github.com/JuanDiego500-sys/reservas-espacios-api/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanDiego500-sys/reservas-espacios-api/actions/workflows/ci.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**English** | [Español](README.es.md)

A REST API for booking computer labs, meeting rooms and an auditorium. It enforces 8 business rules (overlaps, opening hours, capacity, booking window, cancellation, approval) and supports weekly recurring bookings that are created all or nothing.

**Stack:** Astro (server mode, `@astrojs/node`) · TypeScript · PostgreSQL 17 · Docker Compose · plain SQL with `pg` · Vitest

## Context

I built this in **3 days** as a technical challenge for a university IT department:

- **A requirement change halfway through.** On day 3 a new feature arrived: recurring weekly bookings. I added it by reusing the existing rules instead of rewriting them.
- **A live interview.** I had to explain any part of the code and change it live **without AI**.
- **AI used critically.** I worked with Claude Code, and I logged the key prompts, the AI's mistakes and how I caught them in [BITACORA_IA.md](BITACORA_IA.md) (Spanish).
- **Recorded runs.** Every run (tests, migrations, the app) was screen-recorded and logged in [EJECUCIONES.md](EJECUCIONES.md), together with the commit hash.

The requirements are summarized in [docs/requirements.md](docs/requirements.md).

## Highlights

- **Overlap protection at two levels.** The service checks for overlaps to return a clear error. PostgreSQL also enforces an `EXCLUDE USING gist` constraint, so two simultaneous requests can never double-book a space (error `23P01` → HTTP 409).
- **All-or-nothing transactions.** A recurring series validates every date first. If any date fails, nothing is inserted and the response lists each failing date with its rule. Otherwise every date is inserted in a single `BEGIN … COMMIT`.
- **Row locks.** Cancel, approve and reject read the reservation with `SELECT … FOR UPDATE`, so concurrent state changes don't overwrite each other.
- **Pure, testable rules.** The business rules live in `src/reglas/` as pure functions: no database, no HTTP. They receive the current time as a parameter (`ahora`), so time-dependent rules are tested without touching the system clock.
- **One validation path.** A single function, `validarReserva`, checks one date. Single bookings call it once and series call it once per week, so a rule only ever changes in one place.
- **Plain, parameterized SQL.** No ORM: every query is readable SQL with `$1` placeholders, which prevents SQL injection.
- **86 Vitest tests**, covering the rules' edge cases (exactly 24 h, exactly 30 days, back-to-back bookings, 4 h vs 4.5 h, …).

## Architecture

```text
src/pages/api/   Thin HTTP endpoints: read the request, return the response
src/servicios/   Use cases: coordinate rules, database and transactions
src/reglas/      Pure business rules (R1–R8, series, availability)
src/db/          Connection pool and SQL queries
db/              schema.sql (tables, constraints) and datos.sql (seed data)
tests/           Vitest tests for the rules
docs/            Requirements summary and curl examples
```

A request flows like this: endpoint → service → rules (pure) + database (SQL) → JSON response.

## Quick start

Requirements: Node.js 22.23.4+ and Docker Desktop (running).

```bash
git clone https://github.com/JuanDiego500-sys/reservas-espacios-api.git
cd reservas-espacios-api
npm install
npm run db          # start PostgreSQL in a container
npm run db:cargar   # create the tables and load the 7 spaces (also resets the data)
npm run dev         # API at http://localhost:4321
```

Try it (PowerShell; on bash, use `curl` instead of `curl.exe --%`):

```powershell
curl.exe --% -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/espacios"
```

You'll find more requests in [docs/ejemplos_curl.md](docs/ejemplos_curl.md).

## Tests

```bash
npm test
```

The tests don't need the database or the running API.

## API

All routes start with `/api`, because Astro publishes the endpoints in `src/pages/api/` under that path.

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/espacios?tipo=LAB` | List spaces (optional type filter) |
| POST | `/api/espacios` | Create a space (ADMINISTRATIVO only) |
| GET | `/api/espacios/{codigo}/disponibilidad?fecha=YYYY-MM-DD` | Free 30-minute slots |
| POST | `/api/reservas` | Create a booking |
| GET | `/api/reservas?espacio=&fecha=&solicitante=&estado=` | Query bookings |
| POST | `/api/reservas/{id}/cancelar` | Cancel a booking (or one date of a series) |
| POST | `/api/reservas/{id}/aprobar` | Approve a pending booking (ADMINISTRATIVO only) |
| POST | `/api/reservas/{id}/rechazar` | Reject a pending booking (ADMINISTRATIVO only) |
| POST | `/api/reservas/recurrentes` | Create a weekly series of 2–16 weeks (DOCENTE or ADMINISTRATIVO) |
| POST | `/api/reservas/series/{serieId}/cancelar` | Cancel the dates of a series that can still be cancelled |

**Identification (simulated, no login):** every request must send `X-Usuario` (an email) and `X-Rol` (`ESTUDIANTE`, `DOCENTE` or `ADMINISTRATIVO`).

**Request body:**

```json
{ "espacio": "LAB-101", "fecha": "2026-11-25", "inicio": "08:00", "fin": "10:00", "asistentes": 20, "motivo": "Networking class" }
```

For a series, add `"semanas": 4`.

**Errors** always use the same shape:

```json
{ "regla": "R4", "mensaje": "El espacio LAB-201 admite máximo 20 asistentes" }
```

| HTTP | `regla` | When |
| --- | --- | --- |
| 400 | `VALIDACION` | Invalid body, parameters or number of weeks |
| 401 | `IDENTIFICACION` | Missing or invalid headers |
| 403 | `PERMISO` / `SERIE` | Admin-only action / a student tries to create a series |
| 404 | `NO_ENCONTRADO` | Space, booking or series not found |
| 409 | `CONFLICTO` / `R1` | Inactive space, duplicate code or invalid state / overlap |
| 422 | `R2`–`R7` / `SERIE` | A business rule is broken / some dates of a series fail |

## Business rules

All times use America/Bogota (fixed UTC−05:00, no daylight saving time).

| Rule | Summary |
| --- | --- |
| R1 | No overlapping PENDIENTE/CONFIRMADA bookings in the same space (back-to-back is fine) |
| R2 | Mon–Fri 7:00–21:00, Sat 7:00–13:00, closed on Sundays and public holidays |
| R3 | Start and end on :00 or :30, 1 to 4 hours long |
| R4 | From 1 attendee up to the space's capacity |
| R5 | Students can't book the auditorium and can hold at most 2 active bookings |
| R6 | Book at least 24 h and at most 30 days ahead |
| R7 | Only the requester or an admin can cancel, up to 2 h before the start |
| R8 | Auditorium bookings stay PENDIENTE until an admin approves them; everything else is CONFIRMADA |
| Series | 2–16 weeks, all or nothing; R6's 30-day limit applies only to the first date |

## Key decisions

[DECISIONS.md](DECISIONS.md) summarizes the main decisions in English (for example: plain SQL instead of an ORM, the database constraint for overlaps, how errors are prioritized, partial cancellation of a series). The full record, with every alternative I considered, is in [DECISIONES.md](DECISIONES.md) (Spanish).

## A note on language

The project was built for a Spanish-speaking client, so the code, domain terms (`reservas`, `espacios`, `validarReserva`) and process documents are in Spanish. This README and DECISIONS.md are the English entry points.

## Author

**Juan Diego Giraldo Ospina**: [GitHub](https://github.com/JuanDiego500-sys) · [LinkedIn](https://www.linkedin.com/in/juandiegogiraldo-softwaredevelopment)

Licensed under the [MIT License](LICENSE).
