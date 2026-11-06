import type { APIRoute } from 'astro';
import { decidirReserva } from '../../../../servicios/reservas';
import { error, errorDeRegla, json, leerId, leerIdentidad } from '../../_http';

export const POST: APIRoute = async ({ request, params }) => {
    const identidad = leerIdentidad(request);
    if (identidad instanceof Response) return identidad;

    const id = leerId(params.id);
    if (id === null) return error(400, 'VALIDACION', 'El id de la reserva debe ser un entero positivo');

    const resultado = await decidirReserva(id, 'RECHAZADA', identidad, new Date());
    if (resultado.error) return errorDeRegla(resultado.error);
    return json(resultado.datos);
};
