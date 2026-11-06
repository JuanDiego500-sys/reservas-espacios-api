# Ejemplos curl

Recorrido completo de la API, con la respuesta esperada de cada petición.

**Antes de empezar:**

1. Reinicia los datos con `npm run db:cargar` y deja `npm run dev` corriendo. Los ids de abajo (1, 3, 8...) solo coinciden con una base recién cargada y corriendo los ejemplos en orden.
2. Los comandos sirven tal cual en Git Bash, Linux, macOS y `cmd`. **En PowerShell**, cambia `curl` por `curl.exe --%`. Sin esto, PowerShell daña las comillas del JSON.
3. Las fechas sirven si se ejecutan hasta el **17 de noviembre de 2026**. Después, R6 las rechaza por anticipación: cámbialas por fechas entre 24 horas y 30 días hacia adelante.

Calendario usado: 25/11/2026 es miércoles, 26/11 es jueves, 29/11 es domingo y 8/12 es festivo (martes).

## 1. Espacios

```bash
# 200: los 7 espacios
curl -i -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" "http://localhost:4321/api/espacios"

# 200: solo los 4 laboratorios
curl -i -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" "http://localhost:4321/api/espacios?tipo=LAB"

# 400 VALIDACION: el tipo no existe
curl -i -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" "http://localhost:4321/api/espacios?tipo=PISCINA"

# 201: crea un espacio
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" -H "Content-Type: application/json" -d "{\"codigo\":\"LAB-301\",\"nombre\":\"Laboratorio de pruebas\",\"tipo\":\"LAB\",\"capacidad\":15}" "http://localhost:4321/api/espacios"

# 409 CONFLICTO: el código ya existe
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" -H "Content-Type: application/json" -d "{\"codigo\":\"LAB-101\",\"nombre\":\"Repetido\",\"tipo\":\"LAB\",\"capacidad\":15}" "http://localhost:4321/api/espacios"

# 403 PERMISO: solo un ADMINISTRATIVO crea espacios
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"codigo\":\"LAB-302\",\"nombre\":\"Otro\",\"tipo\":\"LAB\",\"capacidad\":15}" "http://localhost:4321/api/espacios"
```

## 2. Disponibilidad

```bash
# 200: 28 bloques, de 07:00 a 21:00
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/espacios/LAB-101/disponibilidad?fecha=2026-11-25"

# 200: lista vacía, porque es domingo
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/espacios/LAB-101/disponibilidad?fecha=2026-11-29"

# 409 CONFLICTO: LAB-103 está inactivo
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/espacios/LAB-103/disponibilidad?fecha=2026-11-25"

# 404 NO_ENCONTRADO: el espacio no existe
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/espacios/LAB-999/disponibilidad?fecha=2026-11-25"
```

## 3. Crear reservas

```bash
# 201 CONFIRMADA (id 1)
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-101\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":20,\"motivo\":\"Clase de redes\"}" "http://localhost:4321/api/reservas"

# 409 R1: se cruza con la anterior
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-101\",\"fecha\":\"2026-11-25\",\"inicio\":\"09:00\",\"fin\":\"11:00\",\"asistentes\":20,\"motivo\":\"Traslape\"}" "http://localhost:4321/api/reservas"

# 201 CONFIRMADA (id 2): empieza justo cuando termina la otra, y eso es válido
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-101\",\"fecha\":\"2026-11-25\",\"inicio\":\"10:00\",\"fin\":\"12:00\",\"asistentes\":20,\"motivo\":\"Contigua\"}" "http://localhost:4321/api/reservas"

# 201 PENDIENTE (id 3): R8, el auditorio espera aprobación
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"AUD-001\",\"fecha\":\"2026-11-25\",\"inicio\":\"10:00\",\"fin\":\"12:00\",\"asistentes\":100,\"motivo\":\"Conferencia\"}" "http://localhost:4321/api/reservas"

# 201 PENDIENTE (id 4): se rechazará más adelante
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"AUD-001\",\"fecha\":\"2026-11-26\",\"inicio\":\"14:00\",\"fin\":\"16:00\",\"asistentes\":50,\"motivo\":\"Charla\"}" "http://localhost:4321/api/reservas"
```

## 4. Reglas que rechazan la reserva

```bash
# 422 R2: termina después de las 21:00
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-25\",\"inicio\":\"20:00\",\"fin\":\"22:00\",\"asistentes\":10,\"motivo\":\"Tarde\"}" "http://localhost:4321/api/reservas"

# 422 R2: el 8 de diciembre es festivo
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-12-08\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"Festivo\"}" "http://localhost:4321/api/reservas"

# 422 R3: los minutos no son :00 ni :30
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:15\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"Minutos\"}" "http://localhost:4321/api/reservas"

# 422 R3: dura menos de 1 hora
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"08:30\",\"asistentes\":10,\"motivo\":\"Corta\"}" "http://localhost:4321/api/reservas"

# 422 R4: LAB-201 admite máximo 20 asistentes
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-201\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":25,\"motivo\":\"Capacidad\"}" "http://localhost:4321/api/reservas"

# 422 R5: un estudiante no puede reservar el auditorio
curl -i -X POST -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" -H "Content-Type: application/json" -d "{\"espacio\":\"AUD-001\",\"fecha\":\"2026-11-27\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":50,\"motivo\":\"Evento\"}" "http://localhost:4321/api/reservas"

# 201 (id 5) y 201 (id 6): las dos reservas activas que permite R5
curl -i -X POST -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" -H "Content-Type: application/json" -d "{\"espacio\":\"SALA-301\",\"fecha\":\"2026-11-26\",\"inicio\":\"08:00\",\"fin\":\"09:00\",\"asistentes\":5,\"motivo\":\"Estudio 1\"}" "http://localhost:4321/api/reservas"
curl -i -X POST -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" -H "Content-Type: application/json" -d "{\"espacio\":\"SALA-301\",\"fecha\":\"2026-11-26\",\"inicio\":\"09:00\",\"fin\":\"10:00\",\"asistentes\":5,\"motivo\":\"Estudio 2\"}" "http://localhost:4321/api/reservas"

# 422 R5: sería la tercera reserva activa
curl -i -X POST -H "X-Usuario: estudiante1@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" -H "Content-Type: application/json" -d "{\"espacio\":\"SALA-301\",\"fecha\":\"2026-11-26\",\"inicio\":\"10:00\",\"fin\":\"11:00\",\"asistentes\":5,\"motivo\":\"Estudio 3\"}" "http://localhost:4321/api/reservas"

# 422 R6: la fecha ya pasó, o faltan menos de 24 horas
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-06\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"Muy pronto\"}" "http://localhost:4321/api/reservas"

# 422 R6: faltan más de 30 días
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2027-02-03\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"Muy lejos\"}" "http://localhost:4321/api/reservas"
```

Los límites exactos de R6 y el plazo de 2 horas de R7 no se muestran aquí, porque dependen de la hora actual. Están en `tests/r6.test.ts` y `tests/r7.test.ts`, con la hora inyectada.

## 5. Otros errores

```bash
# 409 CONFLICTO: LAB-103 está inactivo
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-103\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"Inactivo\"}" "http://localhost:4321/api/reservas"

# 404 NO_ENCONTRADO: el espacio no existe
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-999\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":10,\"motivo\":\"No existe\"}" "http://localhost:4321/api/reservas"

# 400 VALIDACION: asistentes no es entero
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":2.5,\"motivo\":\"Decimal\"}" "http://localhost:4321/api/reservas"

# 401 IDENTIFICACION: sin encabezados
curl -i "http://localhost:4321/api/espacios"

# 401 IDENTIFICACION: rol en minúsculas
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: docente" "http://localhost:4321/api/espacios"
```

## 6. Consultar reservas

```bash
# 200: todas
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas"

# 200: por espacio y fecha
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas?espacio=LAB-101&fecha=2026-11-25"

# 200: por solicitante y estado
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas?solicitante=docente1@ejemplo.edu.co&estado=PENDIENTE"

# 400 VALIDACION: el estado no existe
curl -i -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas?estado=BORRADA"
```

## 7. Cancelar, aprobar y rechazar

```bash
# 422 R7: docente2 no solicitó la reserva 1
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/1/cancelar"

# 200 CANCELADA: la cancela quien la solicitó
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/1/cancelar"

# 409 CONFLICTO: ya estaba cancelada
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/1/cancelar"

# 403 PERMISO: un DOCENTE no aprueba
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/3/aprobar"

# 200 CONFIRMADA
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/3/aprobar"

# 409 CONFLICTO: ya no está pendiente
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/3/aprobar"

# 200 RECHAZADA
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/4/rechazar"

# 404 NO_ENCONTRADO: la reserva no existe
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/999/aprobar"
```

## 8. Reservas recurrentes (ajuste del jueves)

```bash
# 201: serie 1 de 4 semanas (ids 7 a 10): 26/11, 3/12, 10/12 y 17/12
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-26\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":20,\"motivo\":\"Curso semanal\",\"semanas\":4}" "http://localhost:4321/api/reservas/recurrentes"

# 422 SERIE: cruza el festivo del 8 de diciembre; no se crea ninguna y la lista muestra esa fecha con R2
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-12-01\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":20,\"motivo\":\"Cruza festivo\",\"semanas\":2}" "http://localhost:4321/api/reservas/recurrentes"

# 422 SERIE: solo el 26/11 se cruza (R1) con la serie 1; el 19/11 está libre, pero tampoco se crea
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-102\",\"fecha\":\"2026-11-19\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":20,\"motivo\":\"Traslape\",\"semanas\":2}" "http://localhost:4321/api/reservas/recurrentes"

# 403 SERIE: un ESTUDIANTE no puede crear series
curl -i -X POST -H "X-Usuario: estudiante2@ejemplo.edu.co" -H "X-Rol: ESTUDIANTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-201\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":5,\"motivo\":\"Estudio\",\"semanas\":2}" "http://localhost:4321/api/reservas/recurrentes"

# 400 VALIDACION: 1 semana está por debajo del mínimo
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-201\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":5,\"motivo\":\"Corta\",\"semanas\":1}" "http://localhost:4321/api/reservas/recurrentes"

# 400 VALIDACION: 17 semanas está por encima del máximo
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-201\",\"fecha\":\"2026-11-25\",\"inicio\":\"08:00\",\"fin\":\"10:00\",\"asistentes\":5,\"motivo\":\"Larga\",\"semanas\":17}" "http://localhost:4321/api/reservas/recurrentes"

# 201: serie 2 de 16 semanas (ids 11 a 26). Termina a más de 30 días: R6 solo aplica a la primera fecha
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" -H "Content-Type: application/json" -d "{\"espacio\":\"LAB-201\",\"fecha\":\"2026-11-25\",\"inicio\":\"14:00\",\"fin\":\"16:00\",\"asistentes\":15,\"motivo\":\"Semestre\",\"semanas\":16}" "http://localhost:4321/api/reservas/recurrentes"

# 201: serie 3 en el auditorio; cada fecha queda PENDIENTE por R8 (ids 27 y 28)
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" -H "Content-Type: application/json" -d "{\"espacio\":\"AUD-001\",\"fecha\":\"2026-12-02\",\"inicio\":\"09:00\",\"fin\":\"11:00\",\"asistentes\":100,\"motivo\":\"Ciclo de charlas\",\"semanas\":2}" "http://localhost:4321/api/reservas/recurrentes"
```

## 9. Cancelar una fecha o la serie completa

```bash
# 200 CANCELADA: una sola fecha de la serie 1 (id 8, 3/12)
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/8/cancelar"

# 422 R7: docente2 no solicitó la serie 1
curl -i -X POST -H "X-Usuario: docente2@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/series/1/cancelar"

# 200: cancela las 3 fechas que quedan; "omitidas": 1 es la que ya estaba cancelada
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/series/1/cancelar"

# 409 CONFLICTO: ya no quedan fechas por cancelar
curl -i -X POST -H "X-Usuario: docente1@ejemplo.edu.co" -H "X-Rol: DOCENTE" "http://localhost:4321/api/reservas/series/1/cancelar"

# 404 NO_ENCONTRADO: la serie no existe
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/series/99/cancelar"

# 400 VALIDACION: el id no es un número
curl -i -X POST -H "X-Usuario: admin1@ejemplo.edu.co" -H "X-Rol: ADMINISTRATIVO" "http://localhost:4321/api/reservas/series/abc/cancelar"
```
