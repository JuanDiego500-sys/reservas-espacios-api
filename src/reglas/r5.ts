import type { ErrorRegla, TipoRol, TipoEspacio, ReservaExistente  } from './tipos';

export function validarRegla5(rol: TipoRol, espacio: TipoEspacio, reservas: ReservaExistente[], ahora: Date): ErrorRegla | null {
    if (rol !== 'ESTUDIANTE'){
        return null;
    }
    if (espacio === 'AUDITORIO'){
        return { regla: 'R5', mensaje: 'Los estudiantes no pueden reservar el AUDITORIO' };
    }
    if (reservas.filter((r) => (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && r.fin > ahora).length >=2){
        return { regla: 'R5', mensaje: 'Los estudiantes no pueden tener más de 2 reservas activas' };
    }
    return null;

}