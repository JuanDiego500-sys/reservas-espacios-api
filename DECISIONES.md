# Decisiones técnicas

## 1. Rutas con el prefijo `/api`
- **Contexto:** el enunciado pide implementar los endpoints en `src/pages/api/`, y Astro publica esa carpeta bajo `/api`. La tabla de servicios muestra las rutas sin prefijo (`/espacios`).
- **Alternativas:**
  - aceptar el prefijo y documentarlo;
  - redirecciones en `astro.config.mjs` (`curl` no las sigue por defecto y un POST puede perder el cuerpo);
  - un middleware que reescriba `/espacios` como `/api/espacios` (más código que explicar y probar).
- **Decisión:** aceptar `/api`. Las rutas quedan `/api/espacios`, `/api/reservas`, etc. Se le preguntó al evaluador por correo; si pide las rutas sin prefijo, se agrega el middleware.

## 2. PostgreSQL 17 con una versión fija
- **Alternativas:** `postgres:latest`, `postgres:18` y `postgres:17`.
- **Decisión:** `postgres:17`.
  - `latest` puede cambiar de versión mayor sin aviso y romper la instalación en otro computador.
  - La 18 cambió la ruta donde guarda los datos (el volumen se monta distinto), y la mayoría de la documentación y los ejemplos todavía usan la 17.
  - La 17 incluye `btree_gist`, que necesita la restricción `EXCLUDE`.

## 3. Credenciales escritas en `docker-compose.yml`
- **Alternativas:** escribirlas en el compose, o un archivo `.env` con un `.env.example` que se copia antes de arrancar.
- **Decisión:** escribirlas en el compose (`reservas` / `reservas` / `reservas`). Son ficticias y solo locales, y así el evaluador levanta la base de datos con un solo comando, dentro de los 5 minutos que pide el enunciado. En un sistema real irían en un `.env` o en un gestor de secretos, nunca en el repositorio.

## 4. Zona horaria de Bogotá con un desfase fijo de `-05:00`
- **Alternativas:** una librería de fechas (date-fns-tz, Luxon), la API `Intl` de JavaScript o un desfase fijo.
- **Decisión:** desfase fijo de `-05:00`. Colombia no tiene horario de verano, así que el desfase nunca cambia, y no se agregan dependencias. Las fechas se guardan como `timestamptz` en PostgreSQL.
