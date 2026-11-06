import type { APIRoute } from 'astro';
import { crearEspacio, listarEspacios } from '../../../db/espacios';
import { error, json, leerCuerpo, leerIdentidad } from '../_http';

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

// Crea un espacio. Solo ADMINISTRATIVO (decisión 23).
export const POST: APIRoute = async ({ request }) => {
    const id = leerIdentidad(request);
    if (id instanceof Response) return id;
    if (id.rol !== 'ADMINISTRATIVO') {
        return error(403, 'PERMISO', 'Solo un ADMINISTRATIVO puede crear espacios');
    }

    const cuerpo = await leerCuerpo(request);
    if (cuerpo === null) {
        return error(400, 'VALIDACION', 'El cuerpo debe ser un objeto JSON');
    }

    // activo es opcional: si no viene, vale true.
    const { codigo, nombre, tipo, capacidad, activo = true } = cuerpo;

    if (typeof codigo !== 'string' || codigo.trim() === '') {
        return error(400, 'VALIDACION', 'codigo es obligatorio y debe ser texto');
    }
    if (typeof nombre !== 'string' || nombre.trim() === '') {
        return error(400, 'VALIDACION', 'nombre es obligatorio y debe ser texto');
    }
    if (typeof tipo !== 'string' || !TIPOS.includes(tipo)) {
        return error(400, 'VALIDACION', 'tipo debe ser LAB, SALA o AUDITORIO');
    }
    if (typeof capacidad !== 'number' || !Number.isInteger(capacidad) || capacidad <= 0) {
        return error(400, 'VALIDACION', 'capacidad debe ser un entero mayor que 0');
    }
    if (typeof activo !== 'boolean') {
        return error(400, 'VALIDACION', 'activo debe ser true o false');
    }

    const espacio = await crearEspacio(codigo.trim(), nombre.trim(), tipo, capacidad, activo);
    if (espacio === null) {
        return error(409, 'CONFLICTO', `Ya existe un espacio con el código ${codigo.trim()}`);
    }
    return json(espacio, 201);
};
