import type { ErrorRegla } from './tipos';

/**
 * R6: se solicita con mínimo 24 horas y máximo 30 días de anticipación respecto al inicio.
 * Los 30 días son 720 horas exactas y los dos límites son válidos (decisión 15, confirmado por el evaluador).
 * En una serie solo se aplica a la primera fecha (ajuste del jueves).
 * @param ahora hora actual inyectada, para poder probar sin cambiar el reloj
 */
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