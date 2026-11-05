// Tipos compartidos por las reglas. Solo existen al compilar: TypeScript los borra al ejecutar,
// así que no validan datos que llegan de afuera (eso se hace en los endpoints).

/** Error que devuelve una regla. Se responde tal cual en JSON: {"regla": "R4", "mensaje": "..."} */
type  ErrorRegla = {
    regla: string;
    mensaje: string;
}
// Tipos de unión: solo aceptan estos valores, igual que los CHECK de db/schema.sql.
type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA';
type TipoEspacio = 'LAB' | 'SALA' | 'AUDITORIO';
type TipoRol = 'ESTUDIANTE' | 'DOCENTE' | 'ADMINISTRATIVO';

/** Lo mínimo de una reserva guardada que necesitan R1 y R5: cuándo es y en qué estado está. */
type ReservaExistente = {
    inicio: Date;
    fin: Date;
    estado: EstadoReserva;
}

/** Todo lo que validarReserva necesita para revisar una fecha. El servicio lo arma con datos de la petición y de la base de datos. */
type solicitudReserva = {
    inicio: Date;
    fin: Date;
    espacio: { codigo: string, tipo: TipoEspacio, capacidad: number };
    asistentes: number;
    rol: TipoRol;                                // rol de quien pide (encabezado X-Rol)
    reservasDelEspacio: ReservaExistente[];      // para R1: el servicio ya filtró por espacio
    reservasDelSolicitante: ReservaExistente[];  // para R5: el servicio ya filtró por correo
    omitirR6: boolean;                           // true en las fechas 2 en adelante de una serie (ajuste del jueves)
}


export type { ErrorRegla, EstadoReserva, ReservaExistente, TipoEspacio, TipoRol , solicitudReserva };