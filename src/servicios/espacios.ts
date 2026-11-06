import { pool } from '../db/conexion';
import { buscarEspacio, reservasActivasDelEspacio } from '../db/reservas';
import { bloquesLibres } from '../reglas/disponibilidad';
import type { ErrorRegla } from '../reglas/tipos';

/**
 * GET /espacios/{codigo}/disponibilidad (decisión 22): 404 si no existe, 409 si está inactivo
 * y, si no, los bloques libres. Solo lee, así que no necesita transacción y usa el pool.
 */
export async function disponibilidad(codigo: string, fecha: string): Promise<{ error: ErrorRegla | null; datos: unknown }> {
    const espacio = await buscarEspacio(pool, codigo);
    if (espacio === null) {
        return { error: { regla: 'NO_ENCONTRADO', mensaje: `No existe el espacio ${codigo}` }, datos: null };
    }
    if (!espacio.activo) {
        return { error: { regla: 'CONFLICTO', mensaje: `El espacio ${codigo} está inactivo` }, datos: null };
    }
    const reservas = await reservasActivasDelEspacio(pool, codigo);
    return { error: null, datos: { espacio: codigo, fecha, bloques: bloquesLibres(fecha, reservas) } };
}
