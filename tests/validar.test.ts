import { describe, test, expect } from 'vitest';
import { validarReserva } from '../src/reglas/validar.ts';
import type { ReservaExistente } from '../src/reglas/tipos.ts';

// "Ahora" fijo: jueves 5 de noviembre de 2026, 10:00 en Bogotá.
const ahora = new Date('2026-11-05T10:00:00-05:00');

function bogota(fechaHora: string): Date {
  return new Date(`${fechaHora}:00-05:00`);
}

// Solicitud válida de base: un DOCENTE pide LAB-101 el martes 10 de noviembre de 8:00 a 10:00.
// Cada prueba cambia solo lo que necesita con { ...base, campo: valor }.
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

// Una reserva CONFIRMADA de otra persona en LAB-101 de 9:00 a 11:00, que se cruza con la base.
const queSeCruza: ReservaExistente = {
  inicio: bogota('2026-11-10T09:00'),
  fin: bogota('2026-11-10T11:00'),
  estado: 'CONFIRMADA',
};

describe('validarReserva: todas las reglas en orden de prioridad', () => {
  test('acepta una reserva que cumple todas las reglas', () => {
    expect(validarReserva(base, ahora)).toBeNull();
  });

  test('prioridad: si incumple R3 y R1 a la vez, devuelve R3', () => {
    const solicitud = {
      ...base,
      inicio: bogota('2026-11-10T08:15'),
      fin: bogota('2026-11-10T10:15'),
      reservasDelEspacio: [queSeCruza],
    };
    expect(validarReserva(solicitud, ahora)?.regla).toBe('R3');
  });

  test('prioridad: un ESTUDIANTE que pide el auditorio en domingo recibe R5 y no R2', () => {
    const solicitud = {
      ...base,
      inicio: bogota('2026-11-08T08:00'),
      fin: bogota('2026-11-08T10:00'),
      espacio: { codigo: 'AUD-001', tipo: 'AUDITORIO' as const, capacidad: 200 },
      rol: 'ESTUDIANTE' as const,
    };
    expect(validarReserva(solicitud, ahora)?.regla).toBe('R5');
  });

  test('llega hasta el final: si solo incumple R1, devuelve R1', () => {
    const solicitud = { ...base, reservasDelEspacio: [queSeCruza] };
    expect(validarReserva(solicitud, ahora)?.regla).toBe('R1');
  });

  test('rechaza con R6 una reserva 40 días adelante si no se omite R6', () => {
    const solicitud = {
      ...base,
      inicio: bogota('2026-12-15T08:00'),
      fin: bogota('2026-12-15T10:00'),
    };
    expect(validarReserva(solicitud, ahora)?.regla).toBe('R6');
  });

  test('acepta la misma reserva 40 días adelante si se omite R6 (fechas 2 en adelante de una serie)', () => {
    const solicitud = {
      ...base,
      inicio: bogota('2026-12-15T08:00'),
      fin: bogota('2026-12-15T10:00'),
      omitirR6: true,
    };
    expect(validarReserva(solicitud, ahora)).toBeNull();
  });
});
