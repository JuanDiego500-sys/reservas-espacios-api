import type { ErrorRegla, solicitudReserva, TipoRol } from './tipos';
import {validarReserva} from './validar';

export function validarSerie(rol: TipoRol, semanas: number): ErrorRegla | null {
    if (rol === 'ESTUDIANTE'){
        return { regla: 'SERIE', mensaje: 'Los estudiantes no pueden hacer reservas en serie' };
    }
    if (Number.isInteger(semanas) === false){
        return { regla: 'VALIDACION', mensaje: 'El número de semanas para la reserva en serie debe ser un número entero' };
    }
    if ((semanas < 2) || (semanas > 16)){
        return { regla: 'VALIDACION', mensaje: 'El número de semanas para la reserva en serie debe estar entre 2 y 16' };
    }
    return null;
}

export function generarFechas(inicio: Date, fin: Date, semanas: number): {inicio: Date, fin: Date}[] {
    const fechas: {inicio: Date, fin: Date}[] = [];
    const unaSemana = 7 * 24 * 60 * 60 * 1000; // milisegundos en una semana
    for (let i = 0; i < semanas; i++) {
        const inicioSiguiente = new Date(inicio.getTime() + i * unaSemana);
        const finSiguiente = new Date(fin.getTime() + i * unaSemana);
        fechas.push({inicio: inicioSiguiente, fin: finSiguiente});
        
    }
    return fechas;
}

export function validarFechasSerie(solicitud: solicitudReserva, fechas: {inicio: Date, fin: Date}[], ahora: Date): {fecha:string, regla:string, mensaje:string}[]{
    const lista: {fecha:string, regla:string, mensaje:string}[] = [];
    for (let i = 0; i < fechas.length; i++){
        const omitir = i > 0;
        const copia = {asistentes: solicitud.asistentes, espacio: solicitud.espacio, rol: solicitud.rol, reservasDelSolicitante: solicitud.reservasDelSolicitante, reservasDelEspacio: solicitud.reservasDelEspacio, inicio: fechas[i].inicio, fin: fechas[i].fin, omitirR6: omitir};
        const error = validarReserva(copia,ahora);
        if (error) {
            const bogota = new Date(fechas[i].inicio.getTime() - 5 * 60 * 60 * 1000);
            const newFecha = bogota.toISOString().slice(0, 10);
            lista.push({fecha: newFecha, regla: error.regla, mensaje:error.mensaje})
        }
    }
    return lista;
}