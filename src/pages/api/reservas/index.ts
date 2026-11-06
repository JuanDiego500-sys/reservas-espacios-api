import type { APIRoute } from 'astro';
import { crearReserva } from '../../../servicios/reservas';
import { error, errorDeRegla, json, leerCuerpo, leerIdentidad } from '../_http';
import { validarCuerpoReserva } from './_cuerpo';

// Crea una reserva simple. Orden: identidad (401), cuerpo (400) y luego el servicio
// (espacio 404 / 409 y reglas con validarReserva).
export const POST: APIRoute = async ({ request }) => {
    const id = leerIdentidad(request);
    if (id instanceof Response) return id;

    const cuerpo = await leerCuerpo(request);
    if (cuerpo === null) {
        return error(400, 'VALIDACION', 'El cuerpo debe ser un objeto JSON');
    }

    const datos = validarCuerpoReserva(cuerpo);
    if (datos instanceof Response) return datos;

    // Único lugar donde se lee la hora real. El servicio y las reglas la reciben como parámetro.
    const resultado = await crearReserva(datos, id, new Date());
    if (resultado.error) return errorDeRegla(resultado.error);

    return json(resultado.reserva, 201);
};
