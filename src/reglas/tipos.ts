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

export type { ErrorRegla, EstadoReserva, ReservaExistente, TipoEspacio, TipoRol };