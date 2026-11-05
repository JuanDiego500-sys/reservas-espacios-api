import type { ErrorRegla, TipoRol } from './tipos';

export function validarRegla7(reserva: {inicio: Date, solicitante: string},correo:string, rol: TipoRol, ahora: Date): ErrorRegla | null {
    if (rol === 'ADMINISTRATIVO') {
        return null;
    }
    if (reserva.solicitante !== correo) {
        return { regla: 'R7', mensaje: 'Solo quien solicitó la reserva o un ADMINISTRATIVO puede cancelarla' };
    }
    if (reserva.inicio.getTime() - ahora.getTime() < 2 * 60 * 60 * 1000) { // 2 horas en milisegundos
        return { regla: 'R7', mensaje: 'La reserva solo puede cancelarse con al menos 2 horas de anticipación' };
    }
    return null;
}