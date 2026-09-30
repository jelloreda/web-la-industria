import { describe, expect, it } from 'vitest'
import { nombreValido, normalizarNombre, separarNombre } from '../api/_lib/nombres'

describe('nombres', () => {
  it('pone mayúscula inicial y el resto en minúscula', () => {
    expect(normalizarNombre('  álvaro   MARTÍN  ')).toBe('Álvaro Martín')
    expect(normalizarNombre('maría josé garcía-PÉREZ')).toBe('María José García-Pérez')
  })

  it('exige nombre y al menos un apellido, hasta 60 caracteres, solo letras', () => {
    expect(nombreValido('Álvaro Martín')).toBe(true)
    expect(nombreValido('Álvaro')).toBe(false)
    expect(nombreValido('A'.repeat(40) + ' ' + 'B'.repeat(25))).toBe(false)
    expect(nombreValido('Juan 1234')).toBe(false)
    expect(nombreValido("Seán O'neill")).toBe(true)
  })

  it('separa la primera palabra del resto', () => {
    expect(separarNombre('María José García')).toEqual({ name: 'María', lastname: 'José García' })
  })
})
