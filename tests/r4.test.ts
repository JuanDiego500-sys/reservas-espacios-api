import { describe, test, expect } from 'vitest';
import { validarRegla4 } from '../src/reglas/r4.ts';

// LAB-201 (Laboratorio de Redes) tiene capacidad 20 según los datos iniciales.
const codigo = 'LAB-201';
const capacidad = 20;

describe('R4: entre 1 asistente y la capacidad del espacio', () => {
  test('rechaza 0 asistentes', () => {
    expect(validarRegla4(0, codigo, capacidad)?.regla).toBe('R4');
  });

  test('acepta 1 asistente (mínimo)', () => {
    expect(validarRegla4(1, codigo, capacidad)).toBeNull();
  });

  test('acepta exactamente la capacidad (20)', () => {
    expect(validarRegla4(20, codigo, capacidad)).toBeNull();
  });

  test('rechaza uno más que la capacidad (21)', () => {
    expect(validarRegla4(21, codigo, capacidad)?.regla).toBe('R4');
  });

  test('el mensaje de exceso es el del enunciado', () => {
    expect(validarRegla4(21, codigo, capacidad)).toEqual({
      regla: 'R4',
      mensaje: 'El espacio LAB-201 admite máximo 20 asistentes',
    });
  });
});
