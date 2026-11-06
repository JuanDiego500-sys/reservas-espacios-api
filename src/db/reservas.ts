import type { PoolClient } from 'pg';
import type { EstadoReserva, ReservaExistente, TipoEspacio, TipoRol } from '../reglas/tipos';

// Todas las funciones reciben "client": la conexión de la transacción que abrió el servicio.
// Así cada consulta va por la misma conexión que el BEGIN y el COMMIT.

// Columnas que se devuelven al cliente. fecha, inicio y fin salen como texto en hora de Bogotá
// ("2026-11-10", "08:00"), igual que en la petición, en vez de un instante en UTC.
export const COLUMNAS_RESERVA = `
    id, espacio_codigo AS espacio, fecha::text AS fecha,
    to_char(inicio AT TIME ZONE 'America/Bogota', 'HH24:MI') AS inicio,
    to_char(fin    AT TIME ZONE 'America/Bogota', 'HH24:MI') AS fin,
    asistentes, motivo, solicitante, rol, estado, serie_id`;

/** Busca un espacio por código. Devuelve null si no existe. */
export async function buscarEspacio(client: PoolClient, codigo: string) {
    const resultado = await client.query(
        'SELECT codigo, nombre, tipo, capacidad, activo FROM espacios WHERE codigo = $1',
        [codigo],
    );
    return (resultado.rows[0] ?? null) as
        { codigo: string; nombre: string; tipo: TipoEspacio; capacidad: number; activo: boolean } | null;
}

/** Reservas PENDIENTE o CONFIRMADA del espacio: las que pueden chocar en R1. */
export async function reservasActivasDelEspacio(client: PoolClient, codigo: string): Promise<ReservaExistente[]> {
    const resultado = await client.query(
        `SELECT inicio, fin, estado FROM reservas
          WHERE espacio_codigo = $1 AND estado IN ('PENDIENTE', 'CONFIRMADA')`,
        [codigo],
    );
    return resultado.rows;
}

/** Todas las reservas del solicitante. R5 decide cuáles cuentan como activas (decisión 10). */
export async function reservasDelSolicitante(client: PoolClient, correo: string): Promise<ReservaExistente[]> {
    const resultado = await client.query(
        'SELECT inicio, fin, estado FROM reservas WHERE solicitante = $1',
        [correo],
    );
    return resultado.rows;
}

/**
 * Pide un número nuevo a la secuencia de series. Se llama UNA vez por serie y se usa en todas sus fechas.
 * ::int porque nextval devuelve bigint, y pg entrega los bigint como texto ("1") en vez de número.
 */
export async function nuevoSerieId(client: PoolClient): Promise<number> {
    const resultado = await client.query("SELECT nextval('series_id_seq')::int AS id");
    return resultado.rows[0].id;
}

/** Inserta una reserva y la devuelve con COLUMNAS_RESERVA. serieId es null en una reserva simple. */
export async function insertarReserva(client: PoolClient, datos: {
    espacio: string; inicio: Date; fin: Date; asistentes: number; motivo: string;
    solicitante: string; rol: TipoRol; estado: EstadoReserva; serieId: number | null;
}) {
    const resultado = await client.query(
        `INSERT INTO reservas (espacio_codigo, inicio, fin, asistentes, motivo, solicitante, rol, estado, serie_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${COLUMNAS_RESERVA}`,
        [datos.espacio, datos.inicio, datos.fin, datos.asistentes, datos.motivo,
         datos.solicitante, datos.rol, datos.estado, datos.serieId],
    );
    return resultado.rows[0];
}

/** Reserva que se va a cambiar de estado. */
export type ReservaParaCambiar = {
    id: number; inicio: Date; fin: Date; estado: EstadoReserva; solicitante: string; serie_id: number | null;
};

/**
 * Busca una reserva por id y le pone un candado (FOR UPDATE) hasta el COMMIT o el ROLLBACK:
 * si otra petición quiere cambiar la misma reserva, espera a que esta termine. null si no existe.
 */
export async function buscarReservaParaCambiar(client: PoolClient, id: number): Promise<ReservaParaCambiar | null> {
    const resultado = await client.query(
        'SELECT id, inicio, fin, estado, solicitante, serie_id FROM reservas WHERE id = $1 FOR UPDATE',
        [id],
    );
    return resultado.rows[0] ?? null;
}

/** Todas las fechas de una serie, ordenadas, con candado. Lista vacía si la serie no existe. */
export async function reservasDeSerieParaCambiar(client: PoolClient, serieId: number): Promise<ReservaParaCambiar[]> {
    const resultado = await client.query(
        'SELECT id, inicio, fin, estado, solicitante, serie_id FROM reservas WHERE serie_id = $1 ORDER BY inicio FOR UPDATE',
        [serieId],
    );
    return resultado.rows;
}

/**
 * Cambia el estado de una o varias reservas y las devuelve con COLUMNAS_RESERVA.
 * "id = ANY($1::int[])" significa "id está en esta lista": pg convierte el arreglo de JavaScript en uno de PostgreSQL.
 */
export async function cambiarEstado(client: PoolClient, ids: number[], estado: EstadoReserva) {
    const resultado = await client.query(
        `UPDATE reservas SET estado = $2 WHERE id = ANY($1::int[])
         RETURNING ${COLUMNAS_RESERVA}`,
        [ids, estado],
    );
    return resultado.rows;
}
