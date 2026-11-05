import type { ErrorRegla } from './tipos';
import { festivos } from './festivos';

 

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