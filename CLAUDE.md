# Reservas de espacios: API REST

## Objetivo
Producto mínimo viable, completo y de buen nivel para el Reto A. Debe ser simple, rápido de construir y fácil de explicar.
Mi meta es aprender: debo poder explicar y modificar todo el código sin IA en una entrevista de 45 minutos.

Fuente de verdad: @docs/Reto_A.md
Si este archivo y el enunciado se contradicen, manda el enunciado: avísame de la contradicción.

## Mi nivel
Tengo experiencia en infraestructura: Azure, Terraform, Kubernetes y CI/CD.
Explícame TypeScript, Astro y SQL sin dar por sabidos los conceptos.

## Stack
Astro en modo servidor (`@astrojs/node`), TypeScript, PostgreSQL con Docker Compose, SQL plano con `pg` y Vitest.
No agregues otras dependencias sin explicarme por qué hacen falta y sin mi aprobación.

## Estructura
```text
src/pages/api/   Endpoints delgados: leen la petición y devuelven la respuesta
src/servicios/   Casos de uso: coordinan reglas y base de datos
src/reglas/      Funciones puras: sin base de datos, sin HTTP y sin new Date()
src/db/          Conexión y consultas SQL
db/              schema.sql y datos iniciales
tests/           Pruebas de Vitest
docs/            Enunciado y ejemplos curl
```

## Criterios técnicos
- La hora actual siempre entra como parámetro (`ahora: Date`). `new Date()` solo se usa en los endpoints.
- Todas las reglas de horario se evalúan en America/Bogota. Inicio y fin se guardan como `timestamptz`.
- Bogotá no tiene horario de verano: se usa el desfase fijo `-05:00`, sin librerías de fechas (documentarlo en `DECISIONES.md`).
- R1 se valida en el servicio para responder con claridad y en PostgreSQL con una restricción `EXCLUDE`, para resistir peticiones simultáneas.
- La restricción `EXCLUDE` necesita la extensión `btree_gist` de PostgreSQL (`CREATE EXTENSION` en `schema.sql`). Es una extensión de la base de datos, no un paquete npm.
- Crear una reserva ocurre dentro de una transacción.
- Los errores de regla responden `{"regla": "R4", "mensaje": "..."}` con un código HTTP adecuado.
- Las reservas PENDIENTE y CONFIRMADA bloquean el horario. Las RECHAZADA y CANCELADA no.
- Sin capas, clases ni patrones que el proyecto no necesite. Prefiere una función clara a una abstracción.

## Cómo trabajamos
1. Antes de programar, pregúntame cómo lo resolvería yo y espera mi respuesta.
2. Explica brevemente el plan y las alternativas. Yo decido.
3. Trabaja un solo punto del checklist por vez, con cambios pequeños.
4. En las reglas, pídeme los casos límite antes de escribir las pruebas.
5. Si te pido que lo escriba yo, dame pistas y no la solución.
6. Cuando algo no esté definido en el enunciado, detente, dame opciones y anótalo para `DECISIONES.md`.
7. Si cometes un error o lo detecto yo, indícalo para registrarlo en `BITACORA_IA.md`.

## Lo que nunca debes hacer
- No ejecutes la aplicación, pruebas, migraciones ni scripts: dame el comando, yo lo corro y lo grabo.
  Cada grabación se nombra `AAAAMMDD_HHMM_descripcion.mp4` y muestra el comando, la salida completa y el reloj del sistema. También se graban las ejecuciones que fallan.
- No hagas commits: propón un mensaje corto y yo lo hago.
- No marques casillas del checklist: las marco yo.
- No avances al siguiente punto sin mi confirmación.
- No agregues funciones que no estén en el enunciado.
- No uses datos reales: solo los ficticios del enunciado.

## Al cerrar cada punto
Hazme 3 preguntas sobre el porqué del código y una sobre cómo podría fallar. Luego ponme un cambio pequeño para resolver sin ayuda. Si fallo, repásalo conmigo antes de seguir.

## Fuera de alcance
Interfaz gráfica, inicio de sesión real, Swagger, ORM, caché, CI/CD y despliegue.
Si crees que algo de esto hace falta, avísame antes de implementarlo.

## Checklist
Una casilla se marca solo si funciona, la ejecución quedó grabada y yo puedo explicar el código.

### 1. Base del proyecto
- [ ] Repositorio privado con acceso para dir_tecnologias@umanizales.edu.co y carpeta de grabaciones compartida
- [ ] Astro en modo servidor con TypeScript
- [ ] `docker-compose.yml` con PostgreSQL
- [ ] `npm test` funcionando con Vitest
- [ ] Decidido cómo cumplir las rutas del enunciado, ya que `src/pages/api/` publica bajo `/api` (documentarlo). Opciones: aceptar y documentar el prefijo `/api`, usar `rewrites` de Astro o usar un middleware

### 2. Datos
- [ ] Tablas de espacios y reservas con sus restricciones
- [ ] Restricción `EXCLUDE` para traslapes activos
- [ ] Comando para cargar los 7 espacios, incluido LAB-103 inactivo
- [ ] Los 6 festivos cargados o definidos en el código
- [ ] Uso de los usuarios de prueba ficticios en ejemplos y pruebas

### 3. Identificación y errores
- [ ] Lectura y validación de `X-Usuario` y `X-Rol`
- [ ] Formato único de errores en JSON
- [ ] Códigos HTTP definidos para cada tipo de error

### 4. Espacios
- [ ] `GET /espacios` con filtro opcional por tipo
- [ ] `POST /espacios`, solo ADMINISTRATIVO
- [ ] `GET /espacios/{codigo}/disponibilidad?fecha=AAAA-MM-DD`, con bloques de 30 minutos libres según horario y reservas activas

### 5. Reglas
- [ ] R1: sin traslapes entre reservas PENDIENTE o CONFIRMADA; terminar y empezar a la misma hora es válido
- [ ] R2: lunes a viernes de 7:00 a 21:00, sábados de 7:00 a 13:00, sin domingos ni festivos
- [ ] R3: inicio y fin en :00 o :30, duración de 1 a 4 horas
- [ ] R4: de 1 asistente a la capacidad del espacio
- [ ] R5: estudiantes sin auditorio y con máximo 2 reservas activas
- [ ] R6: mínimo 24 horas y máximo 30 días de anticipación
- [ ] R7: cancela quien solicitó o un ADMINISTRATIVO, hasta 2 horas antes
- [ ] R8: auditorio queda PENDIENTE; los demás espacios quedan CONFIRMADA

### 6. Reservas
- [ ] `POST /reservas` con espacio, fecha, inicio, fin, asistentes y motivo
- [ ] Solicitante y rol tomados de los encabezados
- [ ] `GET /reservas` con filtros por espacio, fecha, solicitante y estado
- [ ] `POST /reservas/{id}/cancelar`
- [ ] `POST /reservas/{id}/aprobar`, solo ADMINISTRATIVO y solo si está pendiente
- [ ] `POST /reservas/{id}/rechazar`, solo ADMINISTRATIVO y solo si está pendiente

### 7. Pruebas (mínimo 12)
- [ ] R1: reservas contiguas permitidas, traslape parcial, traslape total y estados que no bloquean
- [ ] R3: minutos inválidos, 30 minutos, 1 hora, 4 horas y 4 horas y media
- [ ] R6: justo en 24 horas, justo por debajo, justo en 30 días y justo por encima
- [ ] R7: límite de 2 horas y permisos, con hora inyectada
- [ ] R2, R4, R5 y R8: al menos un caso válido y uno inválido por regla
- [ ] R2 en el límite: fin exactamente a las 21:00 (válido), sábado hasta las 13:00 (válido), inicio a las 6:30 (inválido)

### 8. Situaciones no definidas
- [ ] Reserva de un espacio inactivo
- [ ] Qué cuenta como reserva activa en R5
- [ ] Si exactamente 24 horas y 30 días son válidos en R6
- [ ] Si el límite de 2 horas de R7 aplica también a ADMINISTRATIVO
- [ ] Aprobación de una reserva cuya fecha ya pasó
- [ ] Prioridad de errores cuando se incumplen varias reglas
- [ ] Encabezados ausentes o con valores inválidos
- [ ] Formato de los errores que no son de regla (validación, 404, 409): qué va en `"regla"`
- [ ] Validación del cuerpo: campos faltantes, formato de fecha y hora, asistentes no enteros, motivo vacío
- [ ] Cancelar una reserva que ya está CANCELADA o RECHAZADA
- [ ] Disponibilidad de un espacio inactivo, en domingo o festivo, en fecha pasada, y si tiene en cuenta R6
- [ ] Quién puede consultar `GET /reservas`: todos los roles o el estudiante solo las suyas
- [ ] `POST /espacios` con código duplicado y valores válidos de tipo (LAB, SALA, AUDITORIO)
- [ ] Preguntas enviadas por correo al evaluador antes del jueves a las 5:00 p. m.

### 9. Ajuste del jueves
- [ ] Requisito analizado: qué cambia y qué partes afecta
- [ ] Implementado con pruebas
- [ ] Decisiones documentadas

### 10. Entregables
- [ ] `README.md` probado desde cero en menos de 5 minutos
- [ ] `DECISIONES.md` con mínimo 5 decisiones y sus alternativas, incluida la justificación de SQL plano frente a un ORM
- [ ] `BITACORA_IA.md` con herramientas, 5 a 10 prompts literales, errores de la IA y partes escritas sin IA
- [ ] `EJECUCIONES.md` con una fila por grabación
- [ ] Colección de ejemplos curl
- [ ] Commits pequeños y frecuentes
- [ ] Ambos enlaces enviados por correo antes del viernes a las 12:00 m.

### 11. Preparación para la entrevista
- [ ] Puedo explicar el recorrido completo de `POST /reservas`
- [ ] Puedo explicar cada regla y su prueba
- [ ] Hice cambios en vivo sin IA y con cronómetro
- [ ] Encontré errores introducidos a propósito usando pruebas y lectura de código
- [ ] Proyecto funcionando en mi computador, con asistentes de IA y autocompletado desactivados
