| Fecha y hora | Comando | Resultado | Commit | Video |
| --- | --- | --- | --- | --- |
| 2026-11-03 (hora en la captura) | `npm install astro @astrojs/node` | Éxito: instaló astro 7.4.5 y @astrojs/node 11.1.9. Solo hay captura de pantalla, no video | pendiente | pendiente (captura) |
| 2026-11-03 23:05 | `npm run build` | Éxito: generó `dist/server/entry.mjs` | pendiente | pendiente (`20261103_2305_npm_run_build.mp4`) |
| 2026-11-03 23:26 | `docker compose up -d`, `docker compose ps` y `docker compose exec db psql -U reservas -d reservas -c "SELECT version();"` | Éxito: contenedor `db` arriba y responde `PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2)` | pendiente | pendiente (`20261103_2326_docker_compose_postgres.mp4`) |
