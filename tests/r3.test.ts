import { describe, test, expect } from 'vitest';
import { validarRegla3 } from '../src/reglas/r3.ts';

// Arma una fecha fija del martes 10 de noviembre de 2026 en hora de Bogotá.
// No es la hora actual: es un instante escrito a mano, así que la prueba siempre da lo mismo.
function hora(hhmm: string): Date {
  return new Date(`2026-11-10T${hhmm}:00-05:00`);
}

describe('R3: bloques de 30 minutos y duración de 1 a 4 horas', () => {
  test('rechaza un inicio que no está en :00 ni :30', () => {
    expect(validarRegla3(hora('08:15'), hora('09:15'))?.regla).toBe('R3');
  });

  test('rechaza un fin que no está en :00 ni :30', () => {
    expect(validarRegla3(hora('08:00'), hora('09:45'))?.regla).toBe('R3');
  });

  test('rechaza una duración de 30 minutos', () => {
    expect(validarRegla3(hora('08:00'), hora('08:30'))?.regla).toBe('R3');
  });

  test('acepta exactamente 1 hora (mínimo)', () => {
    expect(validarRegla3(hora('08:00'), hora('09:00'))).toBeNull();
  });

  test('acepta exactamente 4 horas (máximo), empezando en :30', () => {
    expect(validarRegla3(hora('07:30'), hora('11:30'))).toBeNull();
  });

  test('rechaza 4 horas y media', () => {
    expect(validarRegla3(hora('08:00'), hora('12:30'))?.regla).toBe('R3');
  });

  test('rechaza un fin anterior al inicio', () => {
    expect(validarRegla3(hora('10:00'), hora('08:00'))?.regla).toBe('R3');
  });

  test('rechaza una duración de 0 (fin igual al inicio)', () => {
    expect(validarRegla3(hora('08:00'), hora('08:00'))?.regla).toBe('R3');
  });
});
