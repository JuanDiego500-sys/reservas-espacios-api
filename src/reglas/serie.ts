import type { ErrorRegla, EstadoReserva, solicitudReserva, TipoRol } from './tipos';
import { validarReserva } from './validar';
import { validarRegla7} from './r7';

// Reservas recurrentes semanales (ajuste del jueves): mismo espacio, día de la semana y horario, de 2 a 16 semanas.

/**
 * Revisa la petición de la serie antes de mirar las fechas: quién la pide y cuántas semanas.
 * ESTUDIANTE → "SERIE" (403). Semanas no enteras o fuera de 2 a 16 → "VALIDACION" (400). Decisión 18.
 */
export function validarSerie(rol: TipoRol, semanas: number): ErrorRegla | null {
    if (rol === 'ESTUDIANTE') {
        return { regla: 'SERIE', mensaje: 'Los estudiantes no pueden hacer reservas en serie' };
    }
    if (Number.isInteger(semanas) === false) {
        return { regla: 'VALIDACION', mensaje: 'El número de semanas para la reserva en serie debe ser un número entero' };
    }
    if ((semanas < 2) || (semanas > 16)) {
        return { regla: 'VALIDACION', mensaje: 'El número de semanas para la reserva en serie debe estar entre 2 y 16' };
    }
    return null;
}

/**
 * Genera las fechas de la serie: la semana 0 es la de la petición y cada una suma 7 días a inicio y fin.
 * Sumar milisegundos basta porque Bogotá no tiene horario de verano: la hora del día no cambia.
 */
export function generarFechas(inicio: Date, fin: Date, semanas: number): { inicio: Date, fin: Date }[] {
    const fechas: { inicio: Date, fin: Date }[] = [];
    const unaSemana = 7 * 24 * 60 * 60 * 1000; // milisegundos en una semana
    for (let i = 0; i < semanas; i++) {
        const inicioSiguiente = new Date(inicio.getTime() + i * unaSemana);
        const finSiguiente = new Date(fin.getTime() + i * unaSemana);
        fechas.push({ inicio: inicioSiguiente, fin: finSiguiente });

    }
    return fechas;
}

/**
 * Todo o nada: valida cada fecha con validarReserva y devuelve TODAS las que fallan, con su fecha en Bogotá.
 * Lista vacía = la serie se puede crear completa. R6 se omite desde la segunda fecha (i > 0).
 * No corta en el primer error, porque el ajuste pide listar cada fecha con su problema.
 */
export function validarFechasSerie(solicitud: solicitudReserva, fechas: { inicio: Date, fin: Date }[], ahora: Date): { fecha: string, regla: string, mensaje: string }[] {
    const lista: { fecha: string, regla: string, mensaje: string }[] = [];
    for (let i = 0; i < fechas.length; i++) {
        const omitir = i > 0;
        const copia = { asistentes: solicitud.asistentes, espacio: solicitud.espacio, rol: solicitud.rol, reservasDelSolicitante: solicitud.reservasDelSolicitante, reservasDelEspacio: solicitud.reservasDelEspacio, inicio: fechas[i].inicio, fin: fechas[i].fin, omitirR6: omitir };
        const error = validarReserva(copia, ahora);
        if (error) {
            // La fecha se calcula en Bogotá: una reserva a las 20:00 ya es el día siguiente en UTC.
            const bogota = new Date(fechas[i].inicio.getTime() - 5 * 60 * 60 * 1000);
            const newFecha = bogota.toISOString().slice(0, 10);
            lista.push({ fecha: newFecha, regla: error.regla, mensaje: error.mensaje })
        }
    }
    return lista;
}

/**
 * Decide qué fechas de una serie se cancelan con POST /reservas/series/{serieId}/cancelar.
 * 1. Permiso una sola vez: todas las fechas tienen el mismo solicitante, así que basta la primera (R7).
 * 2. Se cancelan las activas que R7 deja pasar; se omiten las ya canceladas o rechazadas y las que están
 *    a menos de 2 horas (el ADMINISTRATIVO no tiene plazo, decisión 12).
 * 3. Si no queda ninguna → CONFLICTO (409). El servicio responde 404 antes si la serie no existe,
 *    así que reservas nunca llega vacía.
 */
export function cancelablesDeSerie(reservas: { id: number, inicio: Date, solicitante: string, estado: EstadoReserva }[], correo: string, rol: TipoRol, ahora: Date): {error: ErrorRegla | null , ids:number[]}{
    if ((rol !== 'ADMINISTRATIVO') && (reservas[0].solicitante !== correo)){
        return { error: {regla: 'R7', mensaje: 'Solo quien solicitó la reserva o un ADMINISTRATIVO puede cancelarla'}, ids: []};
    }
    const cancelables = reservas.filter((r) => (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE') && (validarRegla7(r, correo, rol, ahora) === null));
    const ids = cancelables.map((r) => r.id)
    if (ids.length === 0) return {error: {regla:'CONFLICTO', mensaje: 'No quedan fechas de la serie que se puedan cancelar'}, ids: []};
    return { error: null , ids};
}