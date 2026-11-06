import type { APIRoute } from 'astro';
import { cancelarSerie } from '../../../../../servicios/reservas';
import { error, errorDeRegla, json, leerId, leerIdentidad } from '../../../_http';

// Cancela todas las fechas de la serie que todavía se pueden cancelar (decisión de la serie y R7).
export const POST: APIRoute = async ({ request, params }) => {
    const identidad = leerIdentidad(request);
    if (identidad instanceof Response) return identidad;

    const serieId = leerId(params.serieId);
    if (serieId === null) return error(400, 'VALIDACION', 'El id de la serie debe ser un entero positivo');

    const resultado = await cancelarSerie(serieId, identidad, new Date());
    if (resultado.error) return errorDeRegla(resultado.error);
    return json(resultado.datos);
};
