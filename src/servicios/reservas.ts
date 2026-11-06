import { pool } from '../db/conexion';
import type { PoolClient } from 'pg';
import type { ErrorRegla, TipoRol } from '../reglas/tipos';
import {
    buscarEspacio, reservasActivasDelEspacio, reservasDelSolicitante, insertarReserva, nuevoSerieId,
    buscarReservaParaCambiar, reservasDeSerieParaCambiar, cambiarEstado,
} from '../db/reservas';
import { validarReserva } from '../reglas/validar';
import { estadoInicial } from '../reglas/r8';
import { cancelablesDeSerie, generarFechas, validarFechasSerie } from '../reglas/serie';
import { validarRegla7 } from '../reglas/r7';

export async function crearReserva(
    datos: { espacio: string; inicio: Date; fin: Date; asistentes: number; motivo: string },
    identidad: { usuario: string; rol: TipoRol },
    ahora: Date,
): Promise<{ error: ErrorRegla | null; reserva: unknown }> {
    const client = await pool.connect();   // pide una conexión prestada al pool
    try {
        await client.query('BEGIN');          // empieza la transacción

        const espacio = await buscarEspacio(client, datos.espacio);
        if (espacio === null) {
            await client.query('ROLLBACK');
            return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe el espacio ${datos.espacio}` }, reserva: null };
        }
        if (espacio.activo === false) {
            await client.query('ROLLBACK');
            return { error: { regla: 'CONFLICTO', mensaje: `El espacio ${datos.espacio} está inactivo` }, reserva: null };
        }

        const delEspacio = await reservasActivasDelEspacio(client, datos.espacio);
        const delSolicitante = await reservasDelSolicitante(client, identidad.usuario);

        const error = validarReserva({
            inicio: datos.inicio,
            fin: datos.fin,
            espacio: espacio,
            asistentes: datos.asistentes,
            rol: identidad.rol,
            reservasDelEspacio: delEspacio,
            reservasDelSolicitante: delSolicitante,
            omitirR6: false,
        }, ahora);

        if (error) {
            await client.query('ROLLBACK');
            return { error: error, reserva: null };
        }

         const reserva = await insertarReserva(client, {
            espacio: datos.espacio,
            inicio: datos.inicio,
            fin: datos.fin,
            asistentes: datos.asistentes,
            motivo: datos.motivo,
            solicitante: identidad.usuario,
            rol: identidad.rol,
            estado: estadoInicial(espacio.tipo),
            serieId: null,
        });

        await client.query('COMMIT');
        return { error: null, reserva: reserva};
     } catch (e) {
        await client.query('ROLLBACK');          // deshace todo
        // 23P01 = PostgreSQL rechazó un traslape (EXCLUDE) porque otra petición llegó al mismo tiempo.
        if ((e as { code?: string }).code === '23P01') {
            return { error: { regla: 'R1', mensaje: `El espacio ${datos.espacio} ya tiene una reserva en ese horario` }, reserva: null };
        }          
        throw e;                            // deja que el error siga (Astro responde 500)
    } finally {
        client.release();                       // devuelve la conexión al pool
    }
}

/**
 * Crea una serie semanal "todo o nada" (ajuste del jueves). Mismo patrón que crearReserva, pero:
 * 1. valida TODAS las fechas con validarFechasSerie (que llama a validarReserva por cada semana);
 * 2. si alguna falla, ROLLBACK y devuelve la lista de fechas con su problema, sin insertar ninguna;
 * 3. si todas pasan, pide UN serie_id y lo pone en todas las fechas.
 * Quién pide y cuántas semanas (validarSerie) ya lo revisó el endpoint, porque no necesita la base.
 */
export async function crearSerie(
    datos: { espacio: string; inicio: Date; fin: Date; asistentes: number; motivo: string },
    semanas: number,
    identidad: { usuario: string; rol: TipoRol },
    ahora: Date,
): Promise<{ error: ErrorRegla | null; fechas: { fecha: string; regla: string; mensaje: string }[]; reservas: unknown[] }> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const espacio = await buscarEspacio(client, datos.espacio);
        if (espacio === null) {
            await client.query('ROLLBACK');
            return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe el espacio ${datos.espacio}` }, fechas: [], reservas: [] };
        }
        if (espacio.activo === false) {
            await client.query('ROLLBACK');
            return { error: { regla: 'CONFLICTO', mensaje: `El espacio ${datos.espacio} está inactivo` }, fechas: [], reservas: [] };
        }

        const delEspacio = await reservasActivasDelEspacio(client, datos.espacio);
        const delSolicitante = await reservasDelSolicitante(client, identidad.usuario);

        // Todo o nada: primero se validan todas las fechas.
        const fechas = generarFechas(datos.inicio, datos.fin, semanas);
        const fallidas = validarFechasSerie({
            inicio: datos.inicio,
            fin: datos.fin,
            espacio: espacio,
            asistentes: datos.asistentes,
            rol: identidad.rol,
            reservasDelEspacio: delEspacio,
            reservasDelSolicitante: delSolicitante,
            omitirR6: false,                  // validarFechasSerie lo cambia a true desde la 2.ª fecha
        }, fechas, ahora);

        if (fallidas.length > 0) {
            await client.query('ROLLBACK');
            return { error: null, fechas: fallidas, reservas: [] };
        }

        // Todas pasan: un solo número para toda la serie y se insertan juntas.
        const serieId = await nuevoSerieId(client);
        const reservas = [];
        for (const f of fechas) {
            reservas.push(await insertarReserva(client, {
                espacio: datos.espacio,
                inicio: f.inicio,
                fin: f.fin,
                asistentes: datos.asistentes,
                motivo: datos.motivo,
                solicitante: identidad.usuario,
                rol: identidad.rol,
                estado: estadoInicial(espacio.tipo),
                serieId: serieId,
            }));
        }

        await client.query('COMMIT');
        return { error: null, fechas: [], reservas };
    } catch (e) {
        await client.query('ROLLBACK');
        // Otra petición tomó una de las fechas al mismo tiempo: EXCLUDE la rechazó y se deshace toda la serie.
        if ((e as { code?: string }).code === '23P01') {
            return { error: { regla: 'R1', mensaje: `El espacio ${datos.espacio} ya tiene una reserva en alguna de las fechas de la serie` }, fechas: [], reservas: [] };
        }
        throw e;
    } finally {
        client.release();
    }
}

// ---------------------------------------------------------------------------
// Cambios de estado: cancelar, aprobar, rechazar y cancelar la serie.
// Los cuatro siguen el mismo camino, así que lo escribimos una sola vez en enTransaccion.
// ---------------------------------------------------------------------------

type Resultado = { error: ErrorRegla | null; datos: unknown };

/**
 * Abre la transacción, ejecuta los pasos que recibe y cierra:
 * COMMIT si los pasos no devolvieron error, ROLLBACK si lo devolvieron o si algo explotó.
 * "pasos" es una función: cada servicio le pasa lo que tiene que hacer con la conexión.
 */
async function enTransaccion(pasos: (client: PoolClient) => Promise<Resultado>): Promise<Resultado> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = await pasos(client);
        await client.query(resultado.error ? 'ROLLBACK' : 'COMMIT');
        return resultado;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

/** POST /reservas/{id}/cancelar: 404, ya inactiva → 409 (decisión 11) y luego R7 (permiso y plazo). */
export function cancelarReserva(id: number, identidad: { usuario: string; rol: TipoRol }, ahora: Date): Promise<Resultado> {
    return enTransaccion(async (client) => {
        const reserva = await buscarReservaParaCambiar(client, id);
        if (reserva === null) {
            return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe la reserva ${id}` }, datos: null };
        }
        if (reserva.estado === 'CANCELADA' || reserva.estado === 'RECHAZADA') {
            return { error: { regla: 'CONFLICTO', mensaje: `La reserva ${id} ya está ${reserva.estado}` }, datos: null };
        }
        const error = validarRegla7(reserva, identidad.usuario, identidad.rol, ahora);
        if (error) return { error, datos: null };

        const [cancelada] = await cambiarEstado(client, [id], 'CANCELADA');
        return { error: null, datos: cancelada };
    });
}

/**
 * POST /reservas/{id}/aprobar y /rechazar (R8): solo ADMINISTRATIVO (403), 404, solo si está PENDIENTE (409).
 * Aprobar una reserva que ya empezó → 409; rechazarla sí se permite (decisión 20).
 */
export function decidirReserva(id: number, nuevoEstado: 'CONFIRMADA' | 'RECHAZADA', identidad: { usuario: string; rol: TipoRol }, ahora: Date): Promise<Resultado> {
    return enTransaccion(async (client) => {
        if (identidad.rol !== 'ADMINISTRATIVO') {
            return { error: { regla: 'PERMISO', mensaje: 'Solo un ADMINISTRATIVO puede aprobar o rechazar reservas' }, datos: null };
        }
        const reserva = await buscarReservaParaCambiar(client, id);
        if (reserva === null) {
            return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe la reserva ${id}` }, datos: null };
        }
        if (reserva.estado !== 'PENDIENTE') {
            return { error: { regla: 'CONFLICTO', mensaje: `La reserva ${id} no está PENDIENTE, está ${reserva.estado}` }, datos: null };
        }
        if (nuevoEstado === 'CONFIRMADA' && reserva.inicio.getTime() <= ahora.getTime()) {
            return { error: { regla: 'CONFLICTO', mensaje: `La reserva ${id} ya empezó y no se puede aprobar` }, datos: null };
        }

        const [cambiada] = await cambiarEstado(client, [id], nuevoEstado);
        return { error: null, datos: cambiada };
    });
}

/** POST /reservas/series/{serieId}/cancelar: 404 si no existe; cancelablesDeSerie decide permiso y fechas. */
export function cancelarSerie(serieId: number, identidad: { usuario: string; rol: TipoRol }, ahora: Date): Promise<Resultado> {
    return enTransaccion(async (client) => {
        const reservas = await reservasDeSerieParaCambiar(client, serieId);
        if (reservas.length === 0) {
            return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe la serie ${serieId}` }, datos: null };
        }
        const { error, ids } = cancelablesDeSerie(reservas, identidad.usuario, identidad.rol, ahora);
        if (error) return { error, datos: null };

        const canceladas = await cambiarEstado(client, ids, 'CANCELADA');
        return { error: null, datos: { canceladas, omitidas: reservas.length - ids.length } };
    });
}
