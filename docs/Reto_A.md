# Reto técnico A — Reservas de laboratorios y salas

Nov 3, 2026 · @Universidad de Manizales

## Reglas generales

Usted tiene hasta el **viernes 6 de noviembre de 2026 a las 12:00 m.** para entregar. Ese viernes en la tarde tendrá una entrevista de 45 minutos en la que explicará su código y lo modificará en vivo.

- **Puede usar IA** (ChatGPT, Claude, Gemini, Copilot u otra). En la entrevista deberá explicar cualquier parte del código que elija el evaluador y hacer un cambio **sin IA**. Lo que no pueda explicar se considera no hecho.
- **Grabe la pantalla en cada ejecución.** Cada vez que ejecute su solución (aplicación, scripts, pruebas o migraciones), grabe desde que lanza el comando hasta que se ve el resultado, también cuando falla. Las instrucciones están en la última sección.
- **Haga commits pequeños y frecuentes** desde hoy. Un repositorio con uno o dos commits al final es una señal negativa.
- **El jueves 5 de noviembre a las 8:00 a. m. recibirá un ajuste de requisitos.** Como en un proyecto real, deberá incorporarlo.
- **Si algo no está definido**, tome una decisión razonable y documéntela en DECISIONES.md. Puede enviar preguntas por correo hasta el jueves a las 5:00 p. m.
- **Alcance:** vale más algo pequeño que funcione y que usted entienda que algo grande que no pueda explicar.
- **Trabajo individual y solo con datos ficticios.** No use datos reales de estudiantes ni de la Universidad.

## Contexto y objetivo

La Unidad de TI presta laboratorios de cómputo, salas de reuniones y el auditorio a docentes, estudiantes y personal administrativo. Hoy las solicitudes llegan por correo y se anotan en una hoja de cálculo, lo que produce cruces de horario y reservas imposibles.

Su reto es construir una **API REST** que gestione esas reservas y haga cumplir las reglas de negocio de este documento.

## Qué debe construir

Una API REST con, como mínimo, estos servicios:

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | /espacios | Lista los espacios; filtro opcional por tipo |
| POST | /espacios | Crea un espacio (solo ADMINISTRATIVO) |
| GET | /espacios/{codigo}/disponibilidad?fecha=AAAA-MM-DD | Bloques de 30 minutos libres en esa fecha |
| POST | /reservas | Crea una reserva |
| GET | /reservas | Consulta con filtros opcionales: espacio, fecha, solicitante, estado |
| POST | /reservas/{id}/cancelar | Cancela una reserva |
| POST | /reservas/{id}/aprobar | Aprueba una reserva pendiente (solo ADMINISTRATIVO) |
| POST | /reservas/{id}/rechazar | Rechaza una reserva pendiente (solo ADMINISTRATIVO) |

- **Datos de una reserva:** espacio, fecha, hora de inicio, hora de fin, número de asistentes y motivo. El solicitante y su rol se toman de la identificación.
- **Estados:** PENDIENTE, CONFIRMADA, RECHAZADA y CANCELADA.
- **Identificación simulada:** no implemente inicio de sesión. Cada petición trae los encabezados `X-Usuario` (correo) y `X-Rol` (ESTUDIANTE, DOCENTE o ADMINISTRATIVO).
- **Errores:** cuando se incumpla una regla, responda con el código HTTP adecuado y un JSON como `{"regla": "R4", "mensaje": "El espacio LAB-201 admite máximo 20 asistentes"}` .
- **Interfaz gráfica:** no es obligatoria.

## Reglas de negocio

Todas las horas se manejan en la zona horaria America/Bogota.

| Código | Regla |
| --- | --- |
| R1 | **Sin traslapes.** Un espacio no puede tener dos reservas PENDIENTE o CONFIRMADA que se crucen. Una reserva que termina a las 10:00 y otra que empieza a las 10:00 no se cruzan. |
| R2 | **Horario.** Lunes a viernes de 7:00 a 21:00 y sábados de 7:00 a 13:00. Domingos y festivos no se presta. Toda la reserva debe quedar dentro del horario. |
| R3 | **Bloques de 30 minutos.** Inicio y fin en punto o y media (:00 o :30). Duración mínima 1 hora y máxima 4 horas. |
| R4 | **Capacidad.** Entre 1 asistente y la capacidad del espacio. |
| R5 | **Estudiantes.** No pueden reservar el auditorio y pueden tener máximo 2 reservas activas a la vez. |
| R6 | **Anticipación.** La reserva se solicita con mínimo 24 horas y máximo 30 días de anticipación respecto a su inicio. |
| R7 | **Cancelación.** Solo la cancela quien la solicitó o un ADMINISTRATIVO, y hasta 2 horas antes del inicio. |
| R8 | **Aprobación.** Las reservas del auditorio quedan PENDIENTE hasta que un ADMINISTRATIVO las apruebe o rechace. Las demás quedan CONFIRMADA al crearse. |

## Datos iniciales

Cargue estos espacios con un script o una migración:

| Código | Nombre | Tipo | Capacidad | Activo |
| --- | --- | --- | --- | --- |
| LAB-101 | Laboratorio de Sistemas 1 | LAB | 30 | Sí |
| LAB-102 | Laboratorio de Sistemas 2 | LAB | 25 | Sí |

| Código | Nombre | Tipo | Capacidad | Activo |
| --- | --- | --- | --- | --- |
| LAB-103 | Laboratorio de Sistemas 3 | LAB | 30 | No |
| LAB-201 | Laboratorio de Redes | LAB | 20 | Sí |
| SALA-301 | Sala de reuniones 1 | SALA | 12 | Sí |
| SALA-302 | Sala de juntas TI | SALA | 8 | Sí |
| AUD-001 | Auditorio | AUDITORIO | 200 | Sí |

**Festivos** (no se presta servicio): lunes 2 de noviembre, lunes 16 de noviembre, martes 8 de diciembre y viernes 25 de diciembre de 2026; viernes 1 y lunes 11 de enero de 2027.

**Usuarios de prueba** (ficticios): `estudiante1@ejemplo.edu.co` y `estudiante2@ejemplo.edu.co` (ESTUDIANTE), `docente1@ejemplo.edu.co` y `docente2@ejemplo.edu.co` (DOCENTE), `admin1@ejemplo.edu.co` (ADMINISTRATIVO).

## Requisitos técnicos y pruebas

- **Stack obligatorio:** Astro en modo servidor (adaptador `@astrojs/node` ) con TypeScript; la API se implementa como endpoints de Astro en `src/pages/api/` . Base de datos PostgreSQL. Si construye interfaz, use AlpineJS y Tailwind.
- **Acceso a datos:** SQL plano o un ORM o constructor de consultas (Drizzle, Prisma, Kysely u otro). Justifique la elección en DECISIONES.md.
- **PostgreSQL reproducible:** incluya un `docker-compose.yml` o instrucciones claras para levantar la base de datos.
- **Mínimo 12 pruebas automatizadas con Vitest** que corran con `npm test` . Deben cubrir los casos límite de R1, R3 y R6.
- Las reglas que dependen de la hora actual (R6 y R7) deben poder probarse **sin esperar ni cambiar el reloj del computador**.
- **Documentación de la API:** OpenAPI (Swagger) o una colección de ejemplos de peticiones (curl, Postman o similar).
- Un comando para cargar los datos iniciales.

## Entregables y cómo se evaluará

Antes del **viernes 6 de noviembre a las 12:00 m.** envíe por correo dos enlaces:

1. **Repositorio Git** (GitHub o GitLab, privado, con acceso para dir_tecnologias@umanizales.edu.co) con:
   - el código fuente y las pruebas;
   - `README.md` : cómo instalar, cargar datos, ejecutar y correr las pruebas en otro computador en menos de 5 minutos;
   - `DECISIONES.md` : mínimo 5 decisiones técnicas con las alternativas que consideró y por qué eligió una, incluidas las situaciones que este enunciado no define;
   - `BITACORA_IA.md` : herramientas usadas, los 5 a 10 prompts más importantes (texto literal), qué respuestas de la IA estaban mal y cómo lo notó, y qué partes escribió sin IA;
   - `EJECUCIONES.md` : una fila por grabación con fecha y hora, comando ejecutado, resultado, commit (hash corto) y enlace al video.
2. **Carpeta de grabaciones** en OneDrive o Google Drive institucional, compartida con el evaluador.

**Cómo grabar cada ejecución**

- Grabe toda ejecución: la aplicación, los scripts, las pruebas y las migraciones, también las que fallan.
- El video debe mostrar el comando, la salida completa y el reloj del sistema.
- Nombre del archivo: `AAAAMMDD_HHMM_descripcion.mp4` , por ejemplo `20261104_1530_pruebas_reglas.mp4` .
- Bastan clips cortos de 1 a 5 minutos, sin narración, en 720p.
- Herramientas gratuitas: en Windows 11, Recortes (Win + Shift + R); en macOS, Cmd + Shift + 5; en Linux, OBS Studio.
- Antes de grabar cierre correo, chats y notificaciones. Las grabaciones se usan solo para esta evaluación.

**Evaluación**

| Criterio | Peso |
| --- | --- |
| Comprensión de su propio código en la entrevista | 30 % |
| Cambio en vivo sin IA | 25 % |
| Cumplimiento de las reglas en los casos de prueba del evaluador | 15 % |

| Criterio | Peso |
| --- | --- |
| Criterio técnico: decisiones, situaciones no definidas y ajuste del jueves | 15 % |
| Calidad del entregable: pruebas, README, historial de commits y grabaciones | 10 % |
| Uso crítico y honesto de la IA | 5 % |

**Entrevista (45 minutos):** demostración (5), recorrido por partes del código que elija el evaluador (10), cambio en vivo sin IA (15), búsqueda de un error (5) y preguntas (10). Lleve su computador con el proyecto funcionando y los asistentes de IA desactivados, incluido el autocompletado tipo Copilot. Puede consultar la documentación oficial de su lenguaje.
