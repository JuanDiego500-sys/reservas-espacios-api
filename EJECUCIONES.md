| Fecha y hora | Comando | Resultado | Commit | Video |
| --- | --- | --- | --- | --- |
| 2026-11-03 (hora en la captura) | `npm install astro @astrojs/node` | Éxito: instaló astro 7.4.5 y @astrojs/node 11.1.9. Solo hay captura de pantalla, no video | 5f6a1ed | pendiente (captura) |
| 2026-11-03 23:05 | `npm run build` | Éxito: generó `dist/server/entry.mjs` | 5f6a1ed | pendiente (`20261103_2305_npm_run_build.mp4`) |
| 2026-11-03 23:26 | `docker compose up -d`, `docker compose ps` y `docker compose exec db psql -U reservas -d reservas -c "SELECT version();"` | Éxito: contenedor `db` arriba y responde `PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2)` | 69adf64 | pendiente (`20261103_2326_docker_compose_postgres.mp4`) |
| 2026-11-03 23:42 | `npm install -D vitest` y `npm test` | Éxito: instaló vitest 5.1.0; 1 prueba pasó (`tests/temporal.test.ts`) | 7a9ec5c | pendiente (`20261103_2342_npm_test.mp4`) |
| 2026-11-04 10:14 | `npm run db`, `npm run db:cargar` y `SELECT codigo, activo FROM espacios;` | Éxito: tablas creadas e `INSERT 0 7`; 7 espacios con LAB-103 inactivo | HASH | pendiente (`20261104_HHMM_carga_datos.mp4`) |