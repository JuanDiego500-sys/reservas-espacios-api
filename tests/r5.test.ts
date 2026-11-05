import { describe, test, expect } from 'vitest';
import { validarRegla5 } from '../src/reglas/r5.ts';
import type { EstadoReserva, ReservaExistente } from '../src/reglas/tipos.ts';

// "Ahora" fijo para todas las pruebas: jueves 5 de noviembre de 2026, 10:00 en Bogotá.
const ahora = new Date('2026-11-05T10:00:00-05:00');

// Arma una reserva del solicitante con inicio y fin en hora de Bogotá.
function reserva(inicio: string, fin: string, estado: EstadoReserva): ReservaExistente {
  return {
    inicio: new Date(`${inicio}-05:00`),
    fin: new Date(`${fin}-05:00`),
    estado,
  };
}

// Reservas futuras (todavía no terminan respecto a "ahora").
const futuraConfirmada = reserva('2026-11-10T08:00:00', '2026-11-10T10:00:00', 'CONFIRMADA');
const futuraPendiente = reserva('2026-11-12T14:00:00', '2026-11-12T16:00:00', 'PENDIENTE');

describe('R5: estudiantes sin auditorio y con máximo 2 reservas activas', () => {
  test('rechaza a un ESTUDIANTE que pide el AUDITORIO', () => {
    expect(validarRegla5('ESTUDIANTE', 'AUDITORIO', [], ahora)?.regla).toBe('R5');
  });

  test('acepta a un DOCENTE que pide el AUDITORIO', () => {
    expect(validarRegla5('DOCENTE', 'AUDITORIO', [], ahora)).toBeNull();
  });

  test('acepta a un ESTUDIANTE con 1 reserva activa que pide un LAB', () => {
    expect(validarRegla5('ESTUDIANTE', 'LAB', [futuraConfirmada], ahora)).toBeNull();
  });

  test('rechaza a un ESTUDIANTE con 2 reservas activas (PENDIENTE y CONFIRMADA)', () => {
    const reservas = [futuraConfirmada, futuraPendiente];
    expect(validarRegla5('ESTUDIANTE', 'LAB', reservas, ahora)?.regla).toBe('R5');
  });

  test('acepta a un ESTUDIANTE cuyas 2 reservas están CANCELADA y RECHAZADA', () => {
    const reservas = [
      reserva('2026-11-10T08:00:00', '2026-11-10T10:00:00', 'CANCELADA'),
      reserva('2026-11-12T14:00:00', '2026-11-12T16:00:00', 'RECHAZADA'),
    ];
    expect(validarRegla5('ESTUDIANTE', 'LAB', reservas, ahora)).toBeNull();
  });

  test('acepta a un ESTUDIANTE con 2 CONFIRMADA si una ya terminó', () => {
    const yaTermino = reserva('2026-11-04T08:00:00', '2026-11-04T10:00:00', 'CONFIRMADA');
    expect(validarRegla5('ESTUDIANTE', 'LAB', [futuraConfirmada, yaTermino], ahora)).toBeNull();
  });

  test('acepta si una de las 2 termina exactamente ahora (ya no está activa)', () => {
    const terminaAhora = reserva('2026-11-05T08:00:00', '2026-11-05T10:00:00', 'CONFIRMADA');
    expect(validarRegla5('ESTUDIANTE', 'LAB', [futuraConfirmada, terminaAhora], ahora)).toBeNull();
  });

  test('acepta a un ESTUDIANTE con 2 reservas PENDIENTE que ya terminaron', () => {
    const reservas = [
      reserva('2026-11-03T08:00:00', '2026-11-03T10:00:00', 'PENDIENTE'),
      reserva('2026-11-04T14:00:00', '2026-11-04T16:00:00', 'PENDIENTE'),
    ];
    expect(validarRegla5('ESTUDIANTE', 'LAB', reservas, ahora)).toBeNull();
  });

  test('acepta a un DOCENTE con 5 reservas activas', () => {
    const reservas = [futuraConfirmada, futuraPendiente, futuraConfirmada, futuraPendiente, futuraConfirmada];
    expect(validarRegla5('DOCENTE', 'SALA', reservas, ahora)).toBeNull();
  });
});
