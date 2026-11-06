import type { APIRoute } from 'astro';
import { disponibilidad } from '../../../../servicios/espacios';
import { error, errorDeRegla, esFechaValida, json, leerIdentidad } from '../../_http';

// /api/espacios/LAB-101/disponibilidad?fecha=2026-11-10 → params.codigo = "LAB-101".
export const GET: APIRoute = async ({ request, params, url }) => {
    const identidad = leerIdentidad(request);
    if (identidad instanceof Response) return identidad;

    const fecha = url.searchParams.get('fecha');
    if (fecha === null || !esFechaValida(fecha)) {
        return error(400, 'VALIDACION', 'fecha es obligatoria, con el formato AAAA-MM-DD');
    }

    const resultado = await disponibilidad(params.codigo ?? '', fecha);
    if (resultado.error) return errorDeRegla(resultado.error);
    return json(resultado.datos);
};
