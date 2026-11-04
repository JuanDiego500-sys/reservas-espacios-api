import type { ErrorRegla } from './tipos';

export function validarRegla6(inicio: Date, ahora: Date): ErrorRegla | null {
    const diferencia = (inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    if (diferencia < 24) {
        return { regla: 'R6', mensaje: 'La reserva debe ser con al menos 24 horas de anticipación' };
    }
    if (diferencia > 30 * 24) {
        return { regla: 'R6', mensaje: 'La reserva no puede ser con más de 30 días de anticipación' };
    }
    return null;
}