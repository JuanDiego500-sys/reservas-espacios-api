type  ErrorRegla = {
    regla: string;
    mensaje: string;
}
type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA';
type TipoEspacio = 'LAB' | 'SALA' | 'AUDITORIO';
type TipoRol = 'ESTUDIANTE' | 'DOCENTE' | 'ADMINISTRATIVO';

type ReservaExistente = {
    inicio: Date;
    fin: Date;
    estado: EstadoReserva;
}

type solicitudReserva = {
    inicio: Date;
    fin: Date;
    espacio: { codigo: string, tipo: TipoEspacio, capacidad: number };
    asistentes: number;
    rol: TipoRol;
    reservasDelEspacio: ReservaExistente[];
    reservasDelSolicitante: ReservaExistente[];
    omitirR6: boolean;
}


export type { ErrorRegla, EstadoReserva, ReservaExistente, TipoEspacio, TipoRol , solicitudReserva };