import type { APIRoute } from 'astro';
import { pool } from '../../../db/conexion';
import { listarReservas } from '../../../db/reservas';
import { crearReserva } from '../../../servicios/reservas';
import { error, errorDeRegla, esFechaValida, json, leerCuerpo, leerIdentidad } from '../_http';
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

const ESTADOS: string[] = ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA'];

// Consulta con filtros opcionales. Todos los roles ven todas las reservas (decisión 21).
export const GET: APIRoute = async ({ request, url }) => {
    const id = leerIdentidad(request);
    if (id instanceof Response) return id;

    const espacio = url.searchParams.get('espacio');
    const fecha = url.searchParams.get('fecha');
    const solicitante = url.searchParams.get('solicitante');
    const estado = url.searchParams.get('estado');

    if (fecha !== null && !esFechaValida(fecha)) {
        return error(400, 'VALIDACION', 'fecha debe tener el formato AAAA-MM-DD');
    }
    if (estado !== null && !ESTADOS.includes(estado)) {
        return error(400, 'VALIDACION', 'estado debe ser PENDIENTE, CONFIRMADA, RECHAZADA o CANCELADA');
    }

    // Solo lee, así que no necesita transacción ni servicio: va directo a la consulta, como GET /espacios.
    return json(await listarReservas(pool, { espacio, fecha, solicitante, estado }));
};
