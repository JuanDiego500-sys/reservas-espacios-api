import { describe, test, expect } from 'vitest';
import { validarRegla1 } from '../src/reglas/r1.ts';
import type { EstadoReserva, ReservaExistente } from '../src/reglas/tipos.ts';

// Todas las horas son del martes 10 de noviembre de 2026 en Bogotá.
function hora(hhmm: string): Date {
  return new Date(`2026-11-10T${hhmm}:00-05:00`);
}

// Arma una reserva existente con solo los datos que R1 necesita.
function existente(desde: string, hasta: string, estado: EstadoReserva): ReservaExistente {
  return { inicio: hora(desde), fin: hora(hasta), estado };
}

// La reserva nueva de todas las pruebas: de 8:00 a 10:00.
const inicio = hora('08:00');
const fin = hora('10:00');

describe('R1: sin traslapes entre reservas PENDIENTE o CONFIRMADA', () => {
  test('acepta si no hay reservas existentes', () => {
    expect(validarRegla1(inicio, fin, [])).toBeNull();
  });

  test('acepta una reserva contigua después (la otra empieza a las 10:00)', () => {
    const existentes = [existente('10:00', '12:00', 'CONFIRMADA')];
    expect(validarRegla1(inicio, fin, existentes)).toBeNull();
  });

  test('acepta una reserva contigua antes (la otra termina a las 8:00)', () => {
    const existentes = [existente('07:00', '08:00', 'CONFIRMADA')];
    expect(validarRegla1(inicio, fin, existentes)).toBeNull();
  });

  test('rechaza un traslape parcial (9:00 a 11:00)', () => {
    const existentes = [existente('09:00', '11:00', 'CONFIRMADA')];
    expect(validarRegla1(inicio, fin, existentes)?.regla).toBe('R1');
  });

  test('rechaza un traslape total (la otra va de 7:00 a 13:00)', () => {
    const existentes = [existente('07:00', '13:00', 'CONFIRMADA')];
    expect(validarRegla1(inicio, fin, existentes)?.regla).toBe('R1');
  });

  test('rechaza un traslape con una reserva PENDIENTE', () => {
    const existentes = [existente('09:00', '11:00', 'PENDIENTE')];
    expect(validarRegla1(inicio, fin, existentes)?.regla).toBe('R1');
  });

  test('acepta un traslape con una reserva CANCELADA', () => {
    const existentes = [existente('09:00', '11:00', 'CANCELADA')];
    expect(validarRegla1(inicio, fin, existentes)).toBeNull();
  });

  test('acepta un traslape con una reserva RECHAZADA', () => {
    const existentes = [existente('09:00', '11:00', 'RECHAZADA')];
    expect(validarRegla1(inicio, fin, existentes)).toBeNull();
  });
});
