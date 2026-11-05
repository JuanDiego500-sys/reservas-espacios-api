import type {ErrorRegla, ReservaExistente} from './tipos';

/**
 * R1: un espacio no puede tener dos reservas PENDIENTE o CONFIRMADA que se crucen.
 * Los rangos son [inicio, fin): una que termina a las 10:00 y otra que empieza a las 10:00 no se cruzan.
 * PostgreSQL lo vuelve a revisar con la restricción EXCLUDE, por si llegan dos peticiones a la vez.
 * @param existentes reservas del mismo espacio, ya filtradas en la consulta
 */
export function validarRegla1(inicio: Date, fin: Date, existentes: ReservaExistente[]): ErrorRegla | null {
    for (const reserva of existentes) {
        if (reserva.estado === 'CANCELADA'|| reserva.estado === 'RECHAZADA') {
            continue; // ignorar reservas canceladas o rechazadas
        }
        // Se cruzan si cada una empieza antes de que la otra termine (< estricto para permitir las contiguas).
        if (inicio.getTime() < reserva.fin.getTime() && fin.getTime() > reserva.inicio.getTime()) {
            return { regla: 'R1', mensaje: 'La reserva se traslapa con otra existente' };
        }
    }
    return null;
}