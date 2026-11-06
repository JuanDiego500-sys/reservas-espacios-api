import { describe, test, expect } from 'vitest';
import { bloquesLibres } from '../src/reglas/disponibilidad.ts';
import type { EstadoReserva } from '../src/reglas/tipos.ts';

function en(fecha: string, hhmm: string): Date {
  return new Date(`${fecha}T${hhmm}:00-05:00`);
}
function reserva(inicio: string, fin: string, estado: EstadoReserva) {
  return { inicio: en('2026-11-10', inicio), fin: en('2026-11-10', fin), estado };
}

describe('Disponibilidad: bloques de 30 minutos libres según R2 y R1', () => {
  test('un martes sin reservas tiene 28 bloques, de 7:00 a 21:00', () => {
    const bloques = bloquesLibres('2026-11-10', []);
    expect(bloques).toHaveLength(28);
    expect(bloques[0]).toEqual({ inicio: '07:00', fin: '07:30' });
    expect(bloques[27]).toEqual({ inicio: '20:30', fin: '21:00' });
  });

  test('un sábado tiene 12 bloques, hasta las 13:00', () => {
    const bloques = bloquesLibres('2026-11-14', []);
    expect(bloques).toHaveLength(12);
    expect(bloques[11]).toEqual({ inicio: '12:30', fin: '13:00' });
  });

  test('domingo y festivo no tienen bloques', () => {
    expect(bloquesLibres('2026-11-15', [])).toEqual([]);
    expect(bloquesLibres('2026-11-16', [])).toEqual([]);
  });

  test('una reserva CONFIRMADA de 8:00 a 10:00 quita 4 bloques y deja libres los contiguos', () => {
    const bloques = bloquesLibres('2026-11-10', [reserva('08:00', '10:00', 'CONFIRMADA')]);
    const inicios = bloques.map((b) => b.inicio);
    expect(bloques).toHaveLength(24);
    expect(inicios).toContain('07:30');
    expect(inicios).not.toContain('08:00');
    expect(inicios).not.toContain('09:30');
    expect(inicios).toContain('10:00');
  });

  test('una reserva CANCELADA no quita bloques', () => {
    expect(bloquesLibres('2026-11-10', [reserva('08:00', '10:00', 'CANCELADA')])).toHaveLength(28);
  });
});
