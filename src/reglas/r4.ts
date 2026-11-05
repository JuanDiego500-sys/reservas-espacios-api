import type { ErrorRegla } from './tipos';

export function validarRegla4(asistentes: number, codigo: string , capacidad: number): ErrorRegla | null {
    if (asistentes < 1)  return { regla: 'R4', mensaje: 'Debe haber al menos un asistente' };
    if (asistentes > capacidad) return { regla: 'R4', mensaje: `El espacio ${codigo} admite máximo ${capacidad} asistentes` };
    return null;
}