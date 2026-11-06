import { pool } from '../db/conexion';
import type { ErrorRegla, TipoRol } from '../reglas/tipos';
import { buscarEspacio, reservasActivasDelEspacio , reservasDelSolicitante, insertarReserva } from '../db/reservas';
import { validarReserva } from '../reglas/validar';
import { estadoInicial } from '../reglas/r8';

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
