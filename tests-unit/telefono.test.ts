import { describe, expect, it } from 'vitest'
import { aE164, mismoTelefono } from '../api/_lib/telefono'

describe('telefono', () => {
  it('acepta móviles y fijos españoles y devuelve E.164', () => {
    expect(aE164('+34', '612 345 678')).toBe('+34612345678')
    expect(aE164('+34', '612-34-56-78')).toBe('+34612345678')
    expect(aE164('+34', '912345678')).toBe('+34912345678')
  })

  it('rechaza números españoles mal formados', () => {
    expect(aE164('+34', '512345678')).toBeNull()
    expect(aE164('+34', '61234567')).toBeNull()
    expect(aE164('+34', '6123456789')).toBeNull()
    expect(aE164('+34', 'abc')).toBeNull()
  })

  it('acepta prefijos extranjeros válidos y rechaza los no permitidos', () => {
    expect(aE164('+44', '7911 123456')).toBe('+447911123456')
    expect(aE164('+99', '612345678')).toBeNull()
    expect(aE164('+44', '123')).toBeNull()
  })

  it('compara por cifras aunque Yeasy lo guarde con guiones', () => {
    expect(mismoTelefono('+34612345678', '+3461-234-5678')).toBe(true)
    expect(mismoTelefono('+34612345678', '+34612345679')).toBe(false)
    expect(mismoTelefono('+34612345678', null)).toBe(false)
    expect(mismoTelefono('+34612345678', '')).toBe(false)
  })
})
