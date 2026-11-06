import type { APIRoute } from 'astro';
import { listarEspacios } from '../../../db/espacios';
import { error, json, leerIdentidad } from '../_http';

// Tipos válidos, iguales al CHECK de db/schema.sql.
const TIPOS: string[] = ['LAB', 'SALA', 'AUDITORIO'];

export const GET: APIRoute = async ({ request, url }) => {
    const id = leerIdentidad(request);
    if (id instanceof Response) return id;

    const tipo = url.searchParams.get('tipo');
    if (tipo !== null && !TIPOS.includes(tipo)) {
        return error(400, 'VALIDACION', `tipo debe ser LAB, SALA o AUDITORIO: ${tipo}`);
    }

    return json(await listarEspacios(tipo));
};
