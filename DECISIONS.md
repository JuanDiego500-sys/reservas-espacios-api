# Key technical decisions

This is an English summary of the most important decisions. The full record has 34 decisions, each with every alternative I considered, and it lives in [DECISIONES.md](DECISIONES.md) (Spanish). The number in brackets points to the full decision there.

## Data and infrastructure

**Plain SQL with `pg` instead of an ORM** [14]
- **Alternatives:** Prisma or Drizzle (ORMs), or Kysely (a query builder).
- **Why:** the most delicate rules live in PostgreSQL itself: an `EXCLUDE` constraint on `tstzrange`, a generated column and `CHECK` constraints. An ORM would still need raw SQL for them. With plain SQL, what you read is exactly what runs.
- **Trade-off:** query results have no automatic types, so I write them by hand. Every query uses parameters (`$1`), never string concatenation, which prevents SQL injection.

**Pinned PostgreSQL 17 image** [2]
- **Alternatives:** `latest` or 18.
- **Why:** `latest` can jump to a new major version without warning. 17 includes `btree_gist` and is what most documentation targets.

**Fixed UTC−05:00 offset for Bogotá** [4]
- **Alternatives:** a date library (Luxon, date-fns-tz) or `Intl`.
- **Why:** Colombia has no daylight saving time, so the offset never changes and no dependency is needed. Times are stored as `timestamptz`.

**Holidays as a constant in code** [6]
- **Alternatives:** a database table or a holiday library.
- **Why:** keeps R2 a pure function that can be tested without a database.

**Database on host port 55432** [31]
- **Why:** local PostgreSQL installations on 5432 and 5433 were answering instead of the container. An uncommon port avoids the same clash on a reviewer's machine. `DATABASE_URL` can override it.

## Business rules

**Overlaps checked twice: in the service and in PostgreSQL** [17, 25]
- **Why:** the service check gives a clear 409 `R1` error. The `EXCLUDE USING gist` constraint guarantees that two simultaneous requests can never double-book a space.

**One error per response, in a fixed priority order** [17]
- **Alternative:** return every error at once.
- **Order:** first headers (401), body (400), space exists (404) and is active (409). Then `validarReserva` checks R5 → R3 → R2 → R6 → R4 → R1. R1 goes last because it depends on other bookings that keep changing, and the database checks it again.

**Same error shape everywhere** [18]
- **Format:** `{"regla", "mensaje"}` for every error, including validation (400), permissions (403), not found (404) and conflicts (409).
- **Status codes:** an overlap is 409, because it conflicts with another resource. The other rules are 422: the request is well formed but breaks a business rule.

**R6's 30 days = exactly 720 hours** [15]
- **Alternative:** 30 calendar days.
- **Why:** it uses the same unit as the 24-hour minimum, and both exact limits are valid (the reviewer confirmed this). Both edges have tests, down to 1 ms.

**Admins can cancel without the 2-hour limit** [12, 13]
- **Why:** admins manage the spaces and must be able to free one in an emergency. The rule checks the permission first and the deadline second, so a stranger doesn't learn details about someone else's booking.

**"Active" booking in R5 = PENDIENTE or CONFIRMADA and not finished** [10]
- **Why:** past bookings stay CONFIRMADA in the database. Counting by status alone would block a student forever.

**Row lock (`SELECT … FOR UPDATE`) when changing a booking's status** [32]
- **Why:** without it, two simultaneous approve/reject requests could both read PENDIENTE, and the last write would win. With the lock, the second request waits, reads the new status and gets a 409.

## Recurring bookings (the mid-challenge requirement change)

**One validation function for everything** [24]
- **Alternative:** a separate validator for series.
- **Why:** `validarReserva` checks a single date. A series calls it once per week, so a rule only ever changes in one place.

**All or nothing in a single transaction** [25]
- **Alternatives:** insert date by date and delete on failure, or skip the failing dates.
- **How:** validate every date first, then insert them all inside `BEGIN … COMMIT`. If anything fails, `ROLLBACK`. A date on a holiday rejects the whole series, as the requirement says.

**Failure response lists every date** [26]
- **Format:** 422 with `{"regla": "SERIE", "mensaje", "fechas": [{"fecha", "regla", "mensaje"}]}`, showing the first error of each failing date.

**R6 only on the first date** [27]
- **How:** the remaining dates use `omitirR6: true`. The requirement removes the 30-day maximum, and the 24-hour minimum is always met, because those dates come after the first one.

**Linking a series: a `serie_id` column fed by a sequence** [28]
- **Alternatives:** a `series` table, `MAX(serie_id) + 1`, or the first booking's `id`.
- **Why:** a series has no data of its own, so a table isn't needed. `MAX + 1` can repeat a number under concurrent requests, while a sequence always returns a unique one.

**Cancelling a series cancels what it can** [29]
- **Alternative:** reject the whole cancellation if any date can't be cancelled.
- **How:** it cancels the dates that can still be cancelled and returns `{"canceladas": [...], "omitidas": N}`. A past date shouldn't stop you from freeing the future ones. If nothing is left to cancel, it returns 409.

## Known limits (accepted and documented) [34]

- **R5 under concurrent requests:** the 2-booking limit has no database lock, so two simultaneous requests from the same student could leave them with 3. I prioritized R1, because a double booking is worse.
- **Identity isn't verified:** anyone can send `X-Rol: ADMINISTRATIVO`. The challenge asked for simulated identification; a real system would use proper authentication.
- **No pagination** on `GET /reservas`.
