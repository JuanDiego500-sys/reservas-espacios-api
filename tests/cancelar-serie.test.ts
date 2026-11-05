import { describe, test, expect } from 'vitest';
import { cancelablesDeSerie } from '../src/reglas/serie.ts';
import type { EstadoReserva } from '../src/reglas/tipos.ts';

// "Ahora" fijo: jueves 5 de noviembre de 2026, 10:00 en Bogotá.
const ahora = new Date('2026-11-05T10:00:00-05:00');

// Arma una reserva de la serie de docente1.
function reserva(id: number, inicio: string, estado: EstadoReserva = 'CONFIRMADA') {
  return {
    id,
    inicio: new Date(`${inicio}:00-05:00`),
    solicitante: 'docente1@ejemplo.edu.co',
    estado,
  };
}

// Serie de 3 martes, todos en el futuro.
const serieFutura = [
  reserva(1, '2026-11-10T08:00'),
  reserva(2, '2026-11-17T08:00'),
  reserva(3, '2026-11-24T08:00'),
];

// Serie de 3 jueves cuya primera fecha empieza en 1 hora (hoy a las 11:00).
const serieQueEmpiezaPronto = [
  reserva(1, '2026-11-05T11:00'),
  reserva(2, '2026-11-12T11:00'),
  reserva(3, '2026-11-19T11:00'),
];

describe('cancelablesDeSerie: qué fechas de una serie se pueden cancelar', () => {
  test('el solicitante cancela una serie con 3 fechas futuras: se cancelan las 3', () => {
    const resultado = cancelablesDeSerie(serieFutura, 'docente1@ejemplo.edu.co', 'DOCENTE', ahora);
    expect(resultado).toEqual({ error: null, ids: [1, 2, 3] });
  });

  test('omite una fecha que ya estaba CANCELADA', () => {
    const serie = [serieFutura[0], reserva(2, '2026-11-17T08:00', 'CANCELADA'), serieFutura[2]];
    const resultado = cancelablesDeSerie(serie, 'docente1@ejemplo.edu.co', 'DOCENTE', ahora);
    expect(resultado).toEqual({ error: null, ids: [1, 3] });
  });

  test('el solicitante no puede cancelar la fecha que empieza en 1 hora (R7), pero sí las demás', () => {
    const resultado = cancelablesDeSerie(serieQueEmpiezaPronto, 'docente1@ejemplo.edu.co', 'DOCENTE', ahora);
    expect(resultado).toEqual({ error: null, ids: [2, 3] });
  });

  test('un ADMINISTRATIVO cancela las 3, incluida la que empieza en 1 hora (no tiene plazo)', () => {
    const resultado = cancelablesDeSerie(serieQueEmpiezaPronto, 'admin1@ejemplo.edu.co', 'ADMINISTRATIVO', ahora);
    expect(resultado).toEqual({ error: null, ids: [1, 2, 3] });
  });

  test('otro DOCENTE no puede cancelar la serie (R7)', () => {
    const resultado = cancelablesDeSerie(serieFutura, 'docente2@ejemplo.edu.co', 'DOCENTE', ahora);
    expect(resultado.error?.regla).toBe('R7');
    expect(resultado.ids).toEqual([]);
  });

  test('si todas las fechas ya pasaron, no queda nada que cancelar (CONFLICTO)', () => {
    const serie = [reserva(1, '2026-10-22T08:00'), reserva(2, '2026-10-29T08:00')];
    const resultado = cancelablesDeSerie(serie, 'docente1@ejemplo.edu.co', 'DOCENTE', ahora);
    expect(resultado.error?.regla).toBe('CONFLICTO');
    expect(resultado.ids).toEqual([]);
  });
});
