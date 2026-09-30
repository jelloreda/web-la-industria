import { beforeEach, describe, expect, it, vi } from 'vitest'
import { yeasy } from '../api/_lib/yeasy'
import { sedePorId, userUuid } from '../api/_lib/sedes'
import { ErrorReserva } from '../api/_lib/errores'
import { fetchFalso } from './helpers/fetch-falso'

describe('yeasy', () => {
  beforeEach(() => {
    vi.stubEnv('YEASY_API_TOKEN', 'token-de-prueba')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('manda el token solo cuando auth es true, y la versión de app siempre', async () => {
    const llamadas = fetchFalso({ 'GET /publico': () => ({ ok: 1 }), 'GET /privado': () => ({ ok: 2 }) })
    await yeasy('/publico')
    await yeasy('/privado', { auth: true })
    expect(llamadas[0].headers.Authorization).toBeUndefined()
    expect(llamadas[0].headers['x-app-version']).toBe('2.1.0')
    expect(llamadas[1].headers.Authorization).toBe('Bearer token-de-prueba')
  })

  it('añade la query y serializa el body', async () => {
    const llamadas = fetchFalso({ 'POST /availability': (url, cuerpo) => ({ q: url.searchParams.get('a'), cuerpo }) })
    const r = await yeasy<{ q: string; cuerpo: unknown }>('/availability', { method: 'POST', body: { x: 1 }, query: { a: 'b' } })
    expect(r).toEqual({ q: 'b', cuerpo: { x: 1 } })
    expect(llamadas[0].cuerpo).toEqual({ x: 1 })
  })

  it('convierte 401, 500 y fallos de red en AGENDA_NO_DISPONIBLE', async () => {
    fetchFalso({ 'GET /caducado': () => new Response('', { status: 401 }), 'GET /roto': () => new Response('', { status: 500 }) })
    await expect(yeasy('/caducado', { auth: true })).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE', status: 503 })
    await expect(yeasy('/roto')).rejects.toBeInstanceOf(ErrorReserva)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network') }))
    await expect(yeasy('/x')).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE' })
  })

  it('sin token no llama a Yeasy', async () => {
    vi.stubEnv('YEASY_API_TOKEN', '')
    const llamadas = fetchFalso({})
    await expect(yeasy('/x', { auth: true })).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE' })
    expect(llamadas).toHaveLength(0)
  })
})

describe('sedes', () => {
  it('resuelve solo las dos sedes conocidas', () => {
    expect(sedePorId('arguelles')?.commerceUuid).toBe('c14b04a8-a151-41e4-b042-0f8c5c678b42')
    expect(sedePorId('guzman-el-bueno')?.commerceUuid).toBe('6f554a4a-15ea-4752-9ea5-985791a6c972')
    expect(sedePorId('otra')).toBeNull()
    expect(sedePorId(null)).toBeNull()
    expect(sedePorId('toString')).toBeNull()
  })

  it('lee el usuario creador de su variable de entorno', () => {
    vi.stubEnv('YEASY_USER_UUID_ARGUELLES', 'u-a')
    expect(userUuid(sedePorId('arguelles')!)).toBe('u-a')
    vi.stubEnv('YEASY_USER_UUID_ARGUELLES', '')
    expect(() => userUuid(sedePorId('arguelles')!)).toThrow(ErrorReserva)
  })
})
