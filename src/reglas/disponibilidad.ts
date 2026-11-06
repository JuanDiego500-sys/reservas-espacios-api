import type { ReservaExistente } from './tipos';
import { validarRegla1 } from './r1';
import { validarRegla2 } from './r2';

/**
 * Bloques de 30 minutos libres de un espacio en una fecha (decisión 22).
 * No repite las reglas: prueba los 48 bloques del día (00:00 a 24:00) y deja los que pasan
 * R2 (horario, domingos y festivos) y R1 (no se cruzan con una reserva activa).
 * Si R2 o R1 cambian, la disponibilidad cambia sola. Domingo o festivo → lista vacía.
 * @param fecha AAAA-MM-DD en Bogotá
 * @param reservas reservas del espacio (R1 ignora las CANCELADA y RECHAZADA)
 */
export function bloquesLibres(fecha: string, reservas: ReservaExistente[]): { inicio: string; fin: string }[] {
    const libres: { inicio: string; fin: string }[] = [];
    const medianoche = new Date(`${fecha}T00:00:00-05:00`).getTime();
    const media = 30 * 60 * 1000; // 30 minutos en milisegundos

    for (let i = 0; i < 48; i++) {
        const inicio = new Date(medianoche + i * media);
        const fin = new Date(medianoche + (i + 1) * media);
        if (validarRegla2(inicio, fin) === null && validarRegla1(inicio, fin, reservas) === null) {
            libres.push({ inicio: hora(i), fin: hora(i + 1) });
        }
    }
    return libres;
}

// Número de bloque → "HH:MM". Ejemplo: el bloque 15 son 15 × 30 = 450 minutos = "07:30".
function hora(bloque: number): string {
    const minutos = bloque * 30;
    const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
    const mm = String(minutos % 60).padStart(2, '0');
    return `${hh}:${mm}`;
}
