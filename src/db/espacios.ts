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

/**
 * Crea un espacio y lo devuelve. Si el código ya existe, no inserta nada y devuelve null.
 * ON CONFLICT lo resuelve la llave primaria, así que funciona aunque lleguen dos peticiones a la vez.
 */
export async function crearEspacio(codigo: string, nombre: string, tipo: string, capacidad: number, activo: boolean) {
    const resultado = await pool.query(
        `INSERT INTO espacios (codigo, nombre, tipo, capacidad, activo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (codigo) DO NOTHING
         RETURNING codigo, nombre, tipo, capacidad, activo`,
        [codigo, nombre, tipo, capacidad, activo],
    );
    return resultado.rows[0] ?? null;
}
