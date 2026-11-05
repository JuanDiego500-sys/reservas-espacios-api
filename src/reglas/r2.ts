import type { ErrorRegla } from './tipos';
import { festivos } from './festivos';

 

/**
 * R2: lunes a viernes de 7:00 a 21:00, sábados de 7:00 a 13:00; domingos y festivos no se presta.
 * Toda la reserva debe quedar dentro del horario. Se evalúa en Bogotá con desfase fijo -05:00 (decisión 4).
 */
export function validarRegla2(inicio: Date, fin: Date): ErrorRegla | null {
    const bogota = new Date(inicio.getTime() - 5 * 60 * 60 * 1000); // convertir a hora de Bogotá
    const dia = bogota.getUTCDay();
    if (dia === 0){
        return { regla: 'R2', mensaje: 'No se pueden hacer reservas los domingos' };
    }
    const fecha = bogota.toISOString().slice(0, 10); // obtener fecha en formato YYYY-MM-DD
    if (festivos.includes(fecha)) {
        return { regla: 'R2', mensaje: 'No se pueden hacer reservas los días festivos' };
    }
    // Se mueve el instante 5 horas y se leen los métodos getUTC...: así no importa la zona del servidor.
    // Las horas se comparan como minutos del día: 7:00 = 420, 13:00 = 780, 21:00 = 1260.
    // El fin se calcula como inicio + duración para que una reserva que termina a medianoche no cuente como 0.
    const minutosInicio = bogota.getUTCHours() * 60 + bogota.getUTCMinutes();
    const duracion = (fin.getTime() - inicio.getTime()) / (1000 * 60);
    const minutosFin = minutosInicio + duracion;

    if (minutosInicio < 420 ){
        return { regla: 'R2', mensaje: 'El inicio de la reserva debe ser después de las 7:00 AM' };
    }
    if (dia === 6 && minutosFin > 780){
        return { regla: 'R2', mensaje: 'El fin de la reserva debe ser antes de las 1:00 PM los sábados' };
    }
    if (minutosFin > 1260){
        return { regla: 'R2', mensaje: 'El fin de la reserva debe ser antes de las 9:00 PM' };
    }
    return null; 
}