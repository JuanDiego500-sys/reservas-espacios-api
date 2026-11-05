import { describe, test, expect } from 'vitest';
import { estadoInicial } from '../src/reglas/r8.ts';

describe('R8: el auditorio queda PENDIENTE y los demás espacios CONFIRMADA', () => {
  test('una reserva de AUDITORIO nace PENDIENTE', () => {
    expect(estadoInicial('AUDITORIO')).toBe('PENDIENTE');
  });

  test('una reserva de LAB nace CONFIRMADA', () => {
    expect(estadoInicial('LAB')).toBe('CONFIRMADA');
  });

  test('una reserva de SALA nace CONFIRMADA', () => {
    expect(estadoInicial('SALA')).toBe('CONFIRMADA');
  });
});
