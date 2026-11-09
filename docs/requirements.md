# Requirements summary

This is my own summary of the challenge requirements. Every user, email and value in it is fictitious.

## Context

An IT department lends computer labs, meeting rooms and an auditorium to teachers, students and administrative staff. Requests used to arrive by email and were tracked in a spreadsheet, which led to double bookings and impossible reservations. The goal is a REST API that manages reservations and enforces the business rules below.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/espacios` | List spaces, with an optional filter by type |
| POST | `/espacios` | Create a space (ADMINISTRATIVO only) |
| GET | `/espacios/{codigo}/disponibilidad?fecha=YYYY-MM-DD` | Free 30-minute slots on that date |
| POST | `/reservas` | Create a reservation |
| GET | `/reservas` | Query with optional filters: space, date, requester, status |
| POST | `/reservas/{id}/cancelar` | Cancel a reservation |
| POST | `/reservas/{id}/aprobar` | Approve a pending reservation (ADMINISTRATIVO only) |
| POST | `/reservas/{id}/rechazar` | Reject a pending reservation (ADMINISTRATIVO only) |
| POST | `/reservas/recurrentes` | Create a weekly recurring series (added mid-challenge) |
| POST | `/reservas/series/{serieId}/cancelar` | Cancel a whole series (my design choice) |

Astro publishes the endpoints under `/api`, and the reviewer accepted that prefix.

- **Reservation data:** space, date, start time, end time, number of attendees and purpose. The requester and their role come from the identification headers.
- **Statuses:** PENDIENTE, CONFIRMADA, RECHAZADA and CANCELADA.
- **Identification:** there is no login. Every request sends `X-Usuario` (email) and `X-Rol` (ESTUDIANTE, DOCENTE or ADMINISTRATIVO).
- **Errors:** when a rule is broken, the API returns a suitable HTTP status and a body like `{"regla": "R4", "mensaje": "..."}`.

## Business rules

All times use the America/Bogota time zone.

| Code | Rule |
| --- | --- |
| R1 | **No overlaps.** A space can't have two PENDIENTE or CONFIRMADA reservations that overlap. One ending at 10:00 and another starting at 10:00 don't overlap. |
| R2 | **Opening hours.** Monday to Friday 7:00–21:00, Saturday 7:00–13:00. Closed on Sundays and public holidays. The whole reservation must fit inside these hours. |
| R3 | **30-minute blocks.** Start and end on :00 or :30. Duration from 1 to 4 hours. |
| R4 | **Capacity.** From 1 attendee up to the space's capacity. |
| R5 | **Students.** They can't book the auditorium and can hold at most 2 active reservations. |
| R6 | **Booking window.** At least 24 hours and at most 30 days before the start. |
| R7 | **Cancellation.** Only the requester or an ADMINISTRATIVO can cancel, up to 2 hours before the start. |
| R8 | **Approval.** Auditorium reservations stay PENDIENTE until an ADMINISTRATIVO approves or rejects them. Everything else is CONFIRMADA when created. |

## Requirement change: recurring reservations

Halfway through the challenge a requirement change arrived:

- DOCENTE and ADMINISTRATIVO users can book the same space, weekday and time slot for 2 to 16 consecutive weeks.
- **All or nothing:** if any date breaks a rule, nothing is created and the response lists every failing date with its problem.
- R6 (the 30-day maximum) applies only to the first date.
- The reservations of a series are linked: you can cancel the whole series or a single date.

## Seed data

| Code | Name | Type | Capacity | Active |
| --- | --- | --- | --- | --- |
| LAB-101 | Laboratorio de Sistemas 1 | LAB | 30 | Yes |
| LAB-102 | Laboratorio de Sistemas 2 | LAB | 25 | Yes |
| LAB-103 | Laboratorio de Sistemas 3 | LAB | 30 | No |
| LAB-201 | Laboratorio de Redes | LAB | 20 | Yes |
| SALA-301 | Sala de reuniones 1 | SALA | 12 | Yes |
| SALA-302 | Sala de juntas TI | SALA | 8 | Yes |
| AUD-001 | Auditorio | AUDITORIO | 200 | Yes |

**Public holidays:** 2 Nov, 16 Nov, 8 Dec and 25 Dec 2026; 1 Jan and 11 Jan 2027.

**Test users (fictitious):** `estudiante1@ejemplo.edu.co` and `estudiante2@ejemplo.edu.co` (ESTUDIANTE), `docente1@ejemplo.edu.co` and `docente2@ejemplo.edu.co` (DOCENTE), `admin1@ejemplo.edu.co` (ADMINISTRATIVO).

## Technical requirements

- Astro in server mode (`@astrojs/node`) with TypeScript, with the endpoints in `src/pages/api/`.
- PostgreSQL that anyone can start the same way (Docker Compose).
- At least 12 Vitest tests run with `npm test`, covering the edge cases of R1, R3 and R6.
- R6 and R7 must be testable without waiting or changing the system clock.
- One command to load the seed data, plus a collection of example requests.
- Anyone must be able to install and run it on another computer in under 5 minutes.
