import { describe, test, expect } from 'vitest';
import { validarRegla2 } from '../src/reglas/r2.ts';

// Arma un instante en hora de Bogotá (-05:00) a partir de la fecha y la hora.
// Fechas usadas: martes 10/11, viernes 13/11, sábado 14/11, domingo 15/11 y lunes festivo 16/11 de 2026.
function en(fecha: string, hhmm: string): Date {
  return new Date(`${fecha}T${hhmm}:00-05:00`);
}

describe('R2: lunes a viernes de 7:00 a 21:00, sábados de 7:00 a 13:00, sin domingos ni festivos', () => {
  test('acepta un martes que empieza justo a las 7:00', () => {
    expect(validarRegla2(en('2026-11-10', '07:00'), en('2026-11-10', '09:00'))).toBeNull();
  });

  test('rechaza un martes que empieza a las 6:30', () => {
    expect(validarRegla2(en('2026-11-10', '06:30'), en('2026-11-10', '08:30'))?.regla).toBe('R2');
  });

  test('acepta un martes que termina justo a las 21:00', () => {
    expect(validarRegla2(en('2026-11-10', '19:00'), en('2026-11-10', '21:00'))).toBeNull();
  });

  test('rechaza un martes que termina a las 21:30', () => {
    expect(validarRegla2(en('2026-11-10', '19:30'), en('2026-11-10', '21:30'))?.regla).toBe('R2');
  });

  test('rechaza un martes que empieza a las 21:00', () => {
    expect(validarRegla2(en('2026-11-10', '21:00'), en('2026-11-10', '22:00'))?.regla).toBe('R2');
  });

  test('acepta un sábado que termina justo a las 13:00', () => {
    expect(validarRegla2(en('2026-11-14', '09:00'), en('2026-11-14', '13:00'))).toBeNull();
  });

  test('rechaza un sábado que termina a las 13:30', () => {
    expect(validarRegla2(en('2026-11-14', '11:30'), en('2026-11-14', '13:30'))?.regla).toBe('R2');
  });

  test('rechaza un sábado que empieza a las 13:00', () => {
    expect(validarRegla2(en('2026-11-14', '13:00'), en('2026-11-14', '14:00'))?.regla).toBe('R2');
  });

  test('rechaza un domingo', () => {
    expect(validarRegla2(en('2026-11-15', '09:00'), en('2026-11-15', '11:00'))?.regla).toBe('R2');
  });

  test('rechaza un festivo (lunes 16 de noviembre)', () => {
    expect(validarRegla2(en('2026-11-16', '07:00'), en('2026-11-16', '09:00'))?.regla).toBe('R2');
  });

  test('rechaza un viernes de 20:00 a medianoche (el fin cae en otro día)', () => {
    expect(validarRegla2(en('2026-11-13', '20:00'), en('2026-11-14', '00:00'))?.regla).toBe('R2');
  });
});
