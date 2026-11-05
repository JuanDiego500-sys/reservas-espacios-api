import type {TipoEspacio, EstadoReserva} from './tipos';

export function estadoInicial(tipo: TipoEspacio): EstadoReserva {
    if (tipo === 'AUDITORIO'){
        return 'PENDIENTE';
    }
    return 'CONFIRMADA';
} 