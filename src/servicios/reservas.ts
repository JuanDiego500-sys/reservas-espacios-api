import { pool } from '../db/conexion';
import type { ErrorRegla, TipoRol } from '../reglas/tipos';
import { buscarEspacio, reservasActivasDelEspacio , reservasDelSolicitante, insertarReserva, nuevoSerieId } from '../db/reservas';
import { validarReserva } from '../reglas/validar';
import { estadoInicial } from '../reglas/r8';
import { generarFechas, validarFechasSerie } from '../reglas/serie';

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
