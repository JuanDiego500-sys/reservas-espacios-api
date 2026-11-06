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

// Código HTTP de cada valor de "regla" (tabla de la decisión 18). Lo que no está aquí (R2 a R7) es 422.
const CODIGOS: Record<string, number> = {
    VALIDACION: 400,
    PERMISO: 403,
    NO_ENCONTRADO: 404,
    CONFLICTO: 409,
    R1: 409,
    SERIE: 403,      // ESTUDIANTE que intenta crear una serie. Las fechas fallidas (422) se responden aparte.
};

/** Convierte un error que devolvió un servicio o una regla en la respuesta HTTP que le corresponde. */
export function errorDeRegla(e: ErrorRegla): Response {
    return error(CODIGOS[e.regla] ?? 422, e.regla, e.mensaje);
}

/**
 * Lee el cuerpo JSON de la petición. Devuelve null si no es un JSON válido o si no es un objeto {...}
 * (por ejemplo 5, "hola" o [1, 2]). El endpoint responde 400 en ese caso.
 */
export async function leerCuerpo(request: Request): Promise<Record<string, unknown> | null> {
    const cuerpo = await request.json().catch(() => null);
    return typeof cuerpo === 'object' && cuerpo !== null && !Array.isArray(cuerpo) ? cuerpo : null;
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

/** Convierte el id de la ruta (/reservas/7/cancelar → "7") en número. null si no es un entero positivo. */
export function leerId(valor: string | undefined): number | null {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/**
 * true si el texto es una fecha AAAA-MM-DD que existe. "2026-02-30" cumple el formato pero no existe:
 * al convertirla en Date y volverla texto sale otra fecha (o ninguna), así que se rechaza.
 */
export function esFechaValida(texto: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const d = new Date(`${texto}T00:00:00Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}
