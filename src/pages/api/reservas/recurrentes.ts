import type { APIRoute } from 'astro';
import { validarSerie } from '../../../reglas/serie';
import { crearSerie } from '../../../servicios/reservas';
import { error, errorDeRegla, json, leerCuerpo, leerIdentidad } from '../_http';
import { validarCuerpoReserva } from './_cuerpo';

// Crea una serie semanal (ajuste del jueves): los datos de una reserva más "semanas".
// Orden: identidad (401), cuerpo (400), quién pide y semanas (403 / 400) y luego el servicio.
export const POST: APIRoute = async ({ request }) => {
    const id = leerIdentidad(request);
    if (id instanceof Response) return id;

    const cuerpo = await leerCuerpo(request);
    if (cuerpo === null) {
        return error(400, 'VALIDACION', 'El cuerpo debe ser un objeto JSON');
    }

    const datos = validarCuerpoReserva(cuerpo);
    if (datos instanceof Response) return datos;

    // "as number" solo calla a TypeScript: validarSerie revisa que sea un entero de 2 a 16.
    const semanas = cuerpo.semanas as number;
    const errorSerie = validarSerie(id.rol, semanas);
    if (errorSerie) return errorDeRegla(errorSerie);

    const resultado = await crearSerie(datos, semanas, id, new Date());

    // Todo o nada: si alguna fecha falla, no se creó ninguna y se listan todas las que fallan.
    if (resultado.fechas.length > 0) {
        return json({
            regla: 'SERIE',
            mensaje: `No se creó la serie: ${resultado.fechas.length} de ${semanas} fechas incumplen una regla`,
            fechas: resultado.fechas,
        }, 422);
    }
    if (resultado.error) return errorDeRegla(resultado.error);

    return json(resultado.reservas, 201);
};
