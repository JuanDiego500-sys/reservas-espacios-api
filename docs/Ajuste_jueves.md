# Ajuste de requisitos del jueves 5 de noviembre de 2026

Correo recibido el jueves 5 de noviembre de 2026 (texto literal). Donde este ajuste modifique el enunciado (`Reto_A.md`), manda el ajuste.

---

Hola,

Como en un proyecto real, llega un ajuste de requisitos. Incorpórelo antes de la entrega del viernes a las 12:00 m.

Reservas recurrentes

Desde hoy los docentes y administrativos pueden crear reservas recurrentes semanales: mismo espacio, día de la semana y horario, durante 2 a 16 semanas.

- Servicio nuevo: POST /reservas/recurrentes, con los datos de una reserva más el número de semanas.
- Todo o nada: si alguna fecha incumple una regla, no se crea ninguna y la respuesta lista cada fecha con su problema.
- La regla R6 (máximo 30 días de anticipación) aplica solo a la primera fecha.
- Las reservas de una serie quedan vinculadas: se puede cancelar la serie completa o una sola fecha.
- Agregue pruebas para estos casos.

Documente en DECISIONES.md cómo lo resolvió y recuerde grabar cada ejecución. Puede enviar preguntas a este correo hasta hoy a las 5:00 p. m

---

## Respuestas del evaluador a las preguntas enviadas el 4 de noviembre (texto literal)

Estas son las respuestas a tus preguntas:
Rutas: está bien con el prefijo /api, porque se deriva de implementar los endpoints de Astro en src/pages/api/. Indícalo en el README y en la documentación de la API.
R6: el enunciado habla de un mínimo de 24 horas y un máximo de 30 días, así que una reserva justo en cualquiera de los dos límites es válida. La forma de contar los 30 días es una decisión tuya; documéntala en DECISIONES.md.
3 a 6. Estas situaciones no están definidas en el enunciado. Son decisiones tuyas: toma la que consideres más razonable y documéntala en DECISIONES.md con las alternativas que consideraste. Donde aplique, cúbrela con pruebas.
