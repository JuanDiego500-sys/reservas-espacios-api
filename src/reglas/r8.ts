import type {TipoEspacio, EstadoReserva} from './tipos';

/**
 * R8: el auditorio queda PENDIENTE hasta que un ADMINISTRATIVO lo apruebe o rechace; los demás quedan CONFIRMADA.
 * No valida nada: decide qué estado se guarda al crear la reserva. Decide por tipo y no por código (decisión 16).
 */
export function estadoInicial(tipo: TipoEspacio): EstadoReserva {
    if (tipo === 'AUDITORIO'){
        return 'PENDIENTE';
    }
    return 'CONFIRMADA';
} 