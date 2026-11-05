import type { ErrorRegla, TipoRol } from './tipos';

/**
 * R7: cancela quien solicitó la reserva o un ADMINISTRATIVO, hasta 2 horas antes del inicio.
 * El ADMINISTRATIVO no tiene plazo (decisión 12). Primero el permiso y después el plazo (decisión 13).
 * @param reserva la reserva a cancelar, traída por id sin filtrar por solicitante
 * @param correo quien hace la petición (encabezado X-Usuario)
 */
export function validarRegla7(reserva: {inicio: Date, solicitante: string},correo:string, rol: TipoRol, ahora: Date): ErrorRegla | null {
    if (rol === 'ADMINISTRATIVO') {
        return null;
    }
    if (reserva.solicitante !== correo) {
        return { regla: 'R7', mensaje: 'Solo quien solicitó la reserva o un ADMINISTRATIVO puede cancelarla' };
    }
    // < y no <=: con exactamente 2 horas todavía se puede cancelar.
    if (reserva.inicio.getTime() - ahora.getTime() < 2 * 60 * 60 * 1000) { // 2 horas en milisegundos
        return { regla: 'R7', mensaje: 'La reserva solo puede cancelarse con al menos 2 horas de anticipación' };
    }
    return null;
}