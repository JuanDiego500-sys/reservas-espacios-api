import { describe, test, expect } from 'vitest';
import { validarSerie, generarFechas, validarFechasSerie } from '../src/reglas/serie.ts';
import type { ReservaExistente } from '../src/reglas/tipos.ts';

// "Ahora" fijo: jueves 5 de noviembre de 2026, 10:00 en Bogotá.
const ahora = new Date('2026-11-05T10:00:00-05:00');

function bogota(fechaHora: string): Date {
  return new Date(`${fechaHora}:00-05:00`);
}

// Datos comunes de la serie: docente1 pide LAB-101 con 10 asistentes.
// inicio, fin y omitirR6 los pone validarFechasSerie en cada fecha.
const base = {
  inicio: bogota('2026-11-10T08:00'),
  fin: bogota('2026-11-10T10:00'),
  asistentes: 10,
  espacio: { codigo: 'LAB-101', tipo: 'LAB' as const, capacidad: 30 },
  rol: 'DOCENTE' as const,
  reservasDelEspacio: [] as ReservaExistente[],
  reservasDelSolicitante: [] as ReservaExistente[],
  omitirR6: false,
};

// Para comparar solo fecha y regla de cada error (el mensaje puede cambiar).
function fechasYReglas(errores: { fecha: string; regla: string }[]) {
  return errores.map((e) => ({ fecha: e.fecha, regla: e.regla }));
}

describe('validarSerie: rol y número de semanas', () => {
  test('acepta a un DOCENTE con 2 semanas (mínimo)', () => {
    expect(validarSerie('DOCENTE', 2)).toBeNull();
  });

  test('acepta a un ADMINISTRATIVO con 16 semanas (máximo)', () => {
    expect(validarSerie('ADMINISTRATIVO', 16)).toBeNull();
  });

  test('rechaza 1 semana', () => {
    expect(validarSerie('DOCENTE', 1)?.regla).toBe('VALIDACION');
  });

  test('rechaza 17 semanas', () => {
    expect(validarSerie('DOCENTE', 17)?.regla).toBe('VALIDACION');
  });

  test('rechaza semanas que no son un número entero (2.5)', () => {
    expect(validarSerie('DOCENTE', 2.5)?.regla).toBe('VALIDACION');
  });

  test('rechaza a un ESTUDIANTE aunque las semanas sean válidas', () => {
    expect(validarSerie('ESTUDIANTE', 4)?.regla).toBe('SERIE');
  });
});

describe('generarFechas: misma hora, una semana después cada vez', () => {
  test('genera 3 fechas desde el martes 10 de noviembre de 8:00 a 10:00', () => {
    const fechas = generarFechas(bogota('2026-11-10T08:00'), bogota('2026-11-10T10:00'), 3);
    expect(fechas).toEqual([
      { inicio: bogota('2026-11-10T08:00'), fin: bogota('2026-11-10T10:00') },
      { inicio: bogota('2026-11-17T08:00'), fin: bogota('2026-11-17T10:00') },
      { inicio: bogota('2026-11-24T08:00'), fin: bogota('2026-11-24T10:00') },
    ]);
  });
});

describe('validarFechasSerie: todo o nada, con la lista de fechas que fallan', () => {
  test('una serie válida de 3 semanas no tiene errores', () => {
    const fechas = generarFechas(bogota('2026-11-10T08:00'), bogota('2026-11-10T10:00'), 3);
    expect(validarFechasSerie(base, fechas, ahora)).toEqual([]);
  });

  test('una serie que cruza el festivo del lunes 16 de noviembre lista solo esa fecha con R2', () => {
    const fechas = generarFechas(bogota('2026-11-09T08:00'), bogota('2026-11-09T10:00'), 3);
    expect(fechasYReglas(validarFechasSerie(base, fechas, ahora))).toEqual([
      { fecha: '2026-11-16', regla: 'R2' },
    ]);
  });

  test('un traslape en una sola semana lista solo esa fecha con R1', () => {
    const ocupada: ReservaExistente = {
      inicio: bogota('2026-11-17T09:00'),
      fin: bogota('2026-11-17T11:00'),
      estado: 'CONFIRMADA',
    };
    const solicitud = { ...base, reservasDelEspacio: [ocupada] };
    const fechas = generarFechas(bogota('2026-11-10T08:00'), bogota('2026-11-10T10:00'), 3);
    expect(fechasYReglas(validarFechasSerie(solicitud, fechas, ahora))).toEqual([
      { fecha: '2026-11-17', regla: 'R1' },
    ]);
  });

  test('R6 no aplica desde la segunda fecha: 16 semanas de miércoles hasta febrero de 2027 son válidas', () => {
    // Miércoles: ningún festivo del enunciado cae en miércoles. La última fecha es el 24 de febrero de 2027.
    const fechas = generarFechas(bogota('2026-11-11T08:00'), bogota('2026-11-11T10:00'), 16);
    expect(validarFechasSerie(base, fechas, ahora)).toEqual([]);
  });

  test('R6 sí aplica a la primera fecha: si empieza a 40 días, solo la primera falla con R6', () => {
    const fechas = generarFechas(bogota('2026-12-15T08:00'), bogota('2026-12-15T10:00'), 2);
    expect(fechasYReglas(validarFechasSerie(base, fechas, ahora))).toEqual([
      { fecha: '2026-12-15', regla: 'R6' },
    ]);
  });
});
