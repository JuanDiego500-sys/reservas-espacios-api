import { describe, test, expect } from 'vitest';
import { validarRegla6 } from '../src/reglas/r6.ts';

// "Ahora" fijo: martes 10 de noviembre de 2026, 08:00 en Bogotá.
// Se inyecta como parámetro, así la prueba no depende del reloj del computador.
const ahora = new Date('2026-11-10T08:00:00-05:00');

describe('R6: anticipación mínima de 24 horas y máxima de 30 días', () => {
  test('acepta un inicio justo 24 horas después', () => {
    const inicio = new Date('2026-11-11T08:00:00-05:00');
    expect(validarRegla6(inicio, ahora)).toBeNull();
  });

  test('rechaza un inicio 1 ms antes de cumplir 24 horas', () => {
    const inicio = new Date('2026-11-11T07:59:59.999-05:00');
    expect(validarRegla6(inicio, ahora)?.regla).toBe('R6');
  });

  test('acepta un inicio justo 30 días después', () => {
    const inicio = new Date('2026-12-10T08:00:00-05:00');
    expect(validarRegla6(inicio, ahora)).toBeNull();
  });

  test('rechaza un inicio 1 ms después de 30 días', () => {
    const inicio = new Date('2026-12-10T08:00:00.001-05:00');
    expect(validarRegla6(inicio, ahora)?.regla).toBe('R6');
  });
});
