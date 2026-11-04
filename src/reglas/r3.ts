import type { ErrorRegla } from './tipos';
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

