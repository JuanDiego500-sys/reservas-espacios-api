import type { ErrorRegla } from './tipos';
/**
 * R3: inicio y fin en :00 o :30, duración mínima 1 hora y máxima 4 horas (los dos límites son válidos).
 * getUTCMinutes sirve porque Bogotá está a -5 horas exactas: los minutos coinciden con los de UTC.
 */
// 1. revisar los minutos de inicio y fin: deben ser 0 o 30
export function validarRegla3(inicio: Date, fin: Date): ErrorRegla | null {
    const minutosInicio = inicio.getUTCMinutes();
    if (minutosInicio !== 0 && minutosInicio !== 30) {
        return { regla: 'R3', mensaje: 'El inicio debe estar en :00 o :30' };
    }
    const minutosFin = fin.getUTCMinutes();
    if (minutosFin !== 0 && minutosFin !== 30) {
        return { regla: 'R3', mensaje: 'El fin debe estar en :00 o :30' };
    }
    // 2. revisar la duración: debe ser de 1 a 4 horas
    const duracion = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60); // duración en horas
    if (duracion < 1 || duracion > 4) {
        return { regla: 'R3', mensaje: 'La duración debe ser de 1 a 4 horas' };
    }
    // Si llegó hasta acá cumple.
    return null;
}

