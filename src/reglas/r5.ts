import type { ErrorRegla, TipoRol, TipoEspacio, ReservaExistente  } from './tipos';

/**
 * R5: los estudiantes no pueden reservar el auditorio y tienen máximo 2 reservas activas a la vez.
 * Activa = PENDIENTE o CONFIRMADA y que todavía no termina (decisión 10).
 * @param reservas reservas del solicitante, ya filtradas por correo en el servicio
 * @param ahora hora actual inyectada, para poder probar sin cambiar el reloj
 */
export function validarRegla5(rol: TipoRol, espacio: TipoEspacio, reservas: ReservaExistente[], ahora: Date): ErrorRegla | null {
    if (rol !== 'ESTUDIANTE'){
        return null;
    }
    if (espacio === 'AUDITORIO'){
        return { regla: 'R5', mensaje: 'Los estudiantes no pueden reservar el AUDITORIO' };
    }
    // Los paréntesis del || son obligatorios: && se evalúa antes y sin ellos las PENDIENTE pasadas contarían.
    // Se rechaza con 2, porque la nueva sería la tercera.
    if (reservas.filter((r) => (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && r.fin > ahora).length >=2){
        return { regla: 'R5', mensaje: 'Los estudiantes no pueden tener más de 2 reservas activas' };
    }
    return null;

}