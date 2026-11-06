import { error, esFechaValida } from '../_http';

// Formato de hora aceptado: HH:MM de 00:00 a 23:59. La fecha la revisa esFechaValida (_http.ts).
// Que los minutos sean :00 o :30 no se revisa aquí: es R3 y responde con su propia regla.
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Datos de una reserva ya revisados y convertidos, listos para el servicio. */
export type DatosReserva = { espacio: string; inicio: Date; fin: Date; asistentes: number; motivo: string };

/**
 * Revisa el cuerpo de una reserva (400 VALIDACION, decisión 18) y arma inicio y fin en hora de Bogotá.
 * Devuelve los datos listos o la respuesta 400. La usan POST /reservas y POST /reservas/recurrentes.
 */
export function validarCuerpoReserva(cuerpo: Record<string, unknown>): DatosReserva | Response {
    const { espacio, fecha, inicio, fin, asistentes, motivo } = cuerpo;

    if (typeof espacio !== 'string' || espacio.trim() === '') {
        return error(400, 'VALIDACION', 'espacio es obligatorio y debe ser texto');
    }
    if (typeof fecha !== 'string' || !esFechaValida(fecha)) {
        return error(400, 'VALIDACION', 'fecha debe tener el formato AAAA-MM-DD y ser una fecha que exista');
    }
    if (typeof inicio !== 'string' || !HORA.test(inicio)) {
        return error(400, 'VALIDACION', 'inicio debe tener el formato HH:MM');
    }
    if (typeof fin !== 'string' || !HORA.test(fin)) {
        return error(400, 'VALIDACION', 'fin debe tener el formato HH:MM');
    }
    if (typeof asistentes !== 'number' || !Number.isInteger(asistentes)) {
        return error(400, 'VALIDACION', 'asistentes debe ser un número entero');
    }
    if (typeof motivo !== 'string' || motivo.trim() === '') {
        return error(400, 'VALIDACION', 'motivo es obligatorio y no puede estar vacío');
    }

    // -05:00 es el desfase fijo de Bogotá (decisión 4): "2026-11-10T08:00:00-05:00" son las 8:00 en Bogotá.
    return {
        espacio: espacio.trim(),
        inicio: new Date(`${fecha}T${inicio}:00-05:00`),
        fin: new Date(`${fecha}T${fin}:00-05:00`),
        asistentes,
        motivo: motivo.trim(),
    };
}

