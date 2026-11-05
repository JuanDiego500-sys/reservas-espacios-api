import type { ErrorRegla, solicitudReserva } from './tipos';
import { validarRegla1 } from './r1';
import { validarRegla2 } from './r2';
import { validarRegla3 } from './r3';
import { validarRegla4 } from './r4';
import { validarRegla5 } from './r5';
import { validarRegla6 } from './r6';


export function validarReserva (solicitud: solicitudReserva, ahora: Date): ErrorRegla | null {
    let error = validarRegla5(solicitud.rol, solicitud.espacio.tipo, solicitud.reservasDelSolicitante, ahora);
    if (error) return error;
    error = validarRegla3(solicitud.inicio, solicitud.fin);
    if (error) return error;
    error = validarRegla2(solicitud.inicio, solicitud.fin);
    if (error) return error;
    if (!solicitud.omitirR6) {
        error = validarRegla6(solicitud.inicio, ahora);
        if (error) return error;
    }
    error = validarRegla4(solicitud.asistentes, solicitud.espacio.codigo, solicitud.espacio.capacidad);
    if (error) return error;
    error = validarRegla1(solicitud.inicio, solicitud.fin, solicitud.reservasDelEspacio);
    if (error) return error;
    return null;
}