import { pool } from './conexion';

/** Lista los espacios ordenados por código. Si se pasa un tipo, solo los de ese tipo. */
export async function listarEspacios(tipo: string | null) {
    const resultado = await pool.query(
        `SELECT codigo, nombre, tipo, capacidad, activo
           FROM espacios
          WHERE $1::text IS NULL OR tipo = $1
          ORDER BY codigo`,
        [tipo],
    );
    return resultado.rows;
}
