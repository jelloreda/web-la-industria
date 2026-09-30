import { describe, expect, it } from 'vitest'
import { esFechaReservable, fechaMadrid, rangoReservable, semanaIso, sumarDias } from '../api/_lib/fecha'

describe('fecha', () => {
  it('usa el día de Madrid, no el de UTC', () => {
    // 22:30 UTC del 29 = 00:30 del 30 en Madrid (CEST)
    expect(fechaMadrid(new Date('2026-09-29T22:30:00Z'))).toBe('2026-09-30')
    expect(fechaMadrid(new Date('2026-09-29T21:30:00Z'))).toBe('2026-09-29')
  })

  it('suma días cruzando de mes', () => {
    expect(sumarDias('2026-09-29', 3)).toBe('2026-10-02')
  })

  it('el rango son 7 días empezando hoy', () => {
    expect(rangoReservable(new Date('2026-10-01T07:00:00Z'))).toEqual([
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
    ])
  })

  it('rechaza ayer, el día 8 y formatos raros', () => {
    const ahora = new Date('2026-10-01T07:00:00Z')
    expect(esFechaReservable('2026-10-01', ahora)).toBe(true)
    expect(esFechaReservable('2026-10-07', ahora)).toBe(true)
    expect(esFechaReservable('2026-09-30', ahora)).toBe(false)
    expect(esFechaReservable('2026-10-08', ahora)).toBe(false)
    expect(esFechaReservable('1/10/2026', ahora)).toBe(false)
  })

  it('calcula la semana ISO como Yeasy', () => {
    expect(semanaIso('2026-09-29')).toEqual({ week: 40, year: 2026 })
    expect(semanaIso('2026-10-01')).toEqual({ week: 40, year: 2026 })
    expect(semanaIso('2027-01-01')).toEqual({ week: 53, year: 2026 })
  })
})
