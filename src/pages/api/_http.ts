import type { ErrorRegla, TipoRol } from '../../reglas/tipos';

// Roles válidos de X-Rol, iguales al CHECK de db/schema.sql.
const ROLES: string[] = ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO'];

/** Responde un JSON con el código HTTP indicado (200 si no se indica). */
export function json(datos: unknown, estado = 200): Response {
    return new Response(JSON.stringify(datos), {
        status: estado,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

/** Error con el formato único de la API: {"regla": "...", "mensaje": "..."} (decisión 18). */
export function error(estado: number, regla: string, mensaje: string): Response {
    return json({ regla, mensaje }, estado);
}

/** Respuesta para el error de una regla: R1 es 409 (choca con otra reserva) y las demás 422 (decisión 18). */
export function errorDeRegla(e: ErrorRegla): Response {
    return error(e.regla === 'R1' ? 409 : 422, e.regla, e.mensaje);
}

/** Lee X-Usuario y X-Rol. Devuelve la identidad o, si algo falla, la respuesta 401 lista para enviar. */
export function leerIdentidad(request: Request): { usuario: string; rol: TipoRol } | Response {
    const usuario = request.headers.get('X-Usuario')?.trim();
    const rol = request.headers.get('X-Rol')?.trim();

    if (!usuario || !rol) {
        return error(401, 'IDENTIFICACION', 'Faltan los encabezados X-Usuario o X-Rol');
    }
    if (!usuario.includes('@')) {
        return error(401, 'IDENTIFICACION', `X-Usuario debe ser un correo: ${usuario}`);
    }
    if (!ROLES.includes(rol)) {
        return error(401, 'IDENTIFICACION', `X-Rol debe ser ESTUDIANTE, DOCENTE o ADMINISTRATIVO: ${rol}`);
    }
    return { usuario, rol: rol as TipoRol };
}
