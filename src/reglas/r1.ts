import type {ErrorRegla, ReservaExistente} from './tipos';

export function validarRegla1(inicio: Date, fin: Date, existentes: ReservaExistente[]): ErrorRegla | null {
    for (const reserva of existentes) {
        if (reserva.estado === 'CANCELADA'|| reserva.estado === 'RECHAZADA') {
            continue; // ignorar reservas canceladas o rechazadas
        }
        if (inicio.getTime() < reserva.fin.getTime() && fin.getTime() > reserva.inicio.getTime()) {
            return { regla: 'R1', mensaje: 'La reserva se traslapa con otra existente' };
        }
    }
    return null;
}