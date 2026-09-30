import { describe, expect, it } from 'vitest'
import { capitalizar, euros, partesFecha } from '@/components/booking/formato'
import { nombreValido, telefonoValido } from '@/lib/booking-validation'

describe('formato', () => {
  it('fechas en español sin depender de Intl', () => {
    expect(partesFecha('2026-09-30')).toEqual({ dow: 'mié', num: '30', diaSemana: 'miércoles', largo: 'miércoles 30 de septiembre', corto: 'mié 30 sep', domingo: false })
    expect(partesFecha('2026-10-04').domingo).toBe(true)
    expect(capitalizar('miércoles 30')).toBe('Miércoles 30')
  })

  it('euros', () => {
    expect(euros(16, false)).toBe('16 €')
    expect(euros(27, true)).toBe('Desde 27 €')
    expect(euros(10.5, false)).toBe('10,50 €')
  })
})

describe('validación en cliente', () => {
  it('teléfono según prefijo', () => {
    expect(telefonoValido('+34', '612 345 678')).toBe(true)
    expect(telefonoValido('+34', '512345678')).toBe(false)
    expect(telefonoValido('+44', '7911123456')).toBe(true)
    expect(telefonoValido('+44', '12')).toBe(false)
  })

  it('nombre con apellido', () => {
    expect(nombreValido('Luis Pérez')).toBe(true)
    expect(nombreValido('  Luis  ')).toBe(false)
  })
})
