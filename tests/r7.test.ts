import { describe, test, expect } from 'vitest';
import { validarRegla7 } from '../src/reglas/r7.ts';

// La reserva de todas las pruebas: la pidió docente1 y empieza el martes 10 de noviembre de 2026 a las 10:00 en Bogotá.
const reserva = {
  inicio: new Date('2026-11-10T10:00:00-05:00'),
  solicitante: 'docente1@ejemplo.edu.co',
};

const UNA_HORA = 60 * 60 * 1000; // en milisegundos

// "Ahora" calculado hacia atrás desde el inicio: horasAntes(3) es 3 horas antes del inicio.
function horasAntes(horas: number): Date {
  return new Date(reserva.inicio.getTime() - horas * UNA_HORA);
}

describe('R7: cancela quien solicitó o un ADMINISTRATIVO, hasta 2 horas antes', () => {
  test('acepta que el solicitante cancele 3 horas antes', () => {
    expect(validarRegla7(reserva, 'docente1@ejemplo.edu.co', 'DOCENTE', horasAntes(3))).toBeNull();
  });

  test('acepta que el solicitante cancele exactamente 2 horas antes (límite)', () => {
    expect(validarRegla7(reserva, 'docente1@ejemplo.edu.co', 'DOCENTE', horasAntes(2))).toBeNull();
  });

  test('rechaza 1 ms después del límite (faltan 2 horas menos 1 ms)', () => {
    const ahora = new Date(horasAntes(2).getTime() + 1);
    expect(validarRegla7(reserva, 'docente1@ejemplo.edu.co', 'DOCENTE', ahora)?.regla).toBe('R7');
  });

  test('rechaza a otro DOCENTE que intenta cancelar', () => {
    expect(validarRegla7(reserva, 'docente2@ejemplo.edu.co', 'DOCENTE', horasAntes(3))?.regla).toBe('R7');
  });

  test('rechaza a un ESTUDIANTE que no es el solicitante', () => {
    expect(validarRegla7(reserva, 'estudiante1@ejemplo.edu.co', 'ESTUDIANTE', horasAntes(3))?.regla).toBe('R7');
  });

  test('acepta que un ADMINISTRATIVO cancele una reserva ajena 3 horas antes', () => {
    expect(validarRegla7(reserva, 'admin1@ejemplo.edu.co', 'ADMINISTRATIVO', horasAntes(3))).toBeNull();
  });

  test('acepta que un ADMINISTRATIVO cancele a 1 hora del inicio (el plazo no aplica al ADMINISTRATIVO)', () => {
    expect(validarRegla7(reserva, 'admin1@ejemplo.edu.co', 'ADMINISTRATIVO', horasAntes(1))).toBeNull();
  });

  test('acepta que un ADMINISTRATIVO cancele una reserva que ya empezó', () => {
    expect(validarRegla7(reserva, 'admin1@ejemplo.edu.co', 'ADMINISTRATIVO', horasAntes(-0.5))).toBeNull();
  });

  test('rechaza que el solicitante cancele una reserva que ya empezó', () => {
    expect(validarRegla7(reserva, 'docente1@ejemplo.edu.co', 'DOCENTE', horasAntes(-0.5))?.regla).toBe('R7');
  });
});
