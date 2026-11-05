import type { ErrorRegla } from './tipos';

/**
 * R4: entre 1 asistente y la capacidad del espacio.
 * No revisa que sea entero: 2.5 pasaría. Eso se valida antes, en el cuerpo de la petición (decisión 18).
 */
export function validarRegla4(asistentes: number, codigo: string , capacidad: number): ErrorRegla | null {
    if (asistentes < 1)  return { regla: 'R4', mensaje: 'Debe haber al menos un asistente' };
    if (asistentes > capacidad) return { regla: 'R4', mensaje: `El espacio ${codigo} admite máximo ${capacidad} asistentes` };
    return null;
}