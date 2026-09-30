import { describe, expect, it, vi } from 'vitest'
import { aServiciosPublicos, buscarServicio, limpiarNombre } from '../api/_lib/servicios'
import { GET } from '../api/reservas/servicios'
import { fetchFalso } from './helpers/fetch-falso'
import { COMMERCE_G, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA } from './helpers/datos'

describe('servicios', () => {
  it('limpia nombres sin entrada en el mapa', () => {
    expect(limpiarNombre('corte  niño+cejas(rápido)')).toBe('Corte niño + cejas (rápido)')
    expect(limpiarNombre('Corte a tijera+taper(mullet,warrior,modcut)')).toBe('Corte a tijera + taper (mullet, warrior, modcut)')
    expect(limpiarNombre('Corte Tijera y Barba desde ')).toBe('Corte Tijera y Barba')
  })

  it('filtra, ordena, limpia y detecta "desde"', () => {
    expect(aServiciosPublicos(SERVICIOS_Y)).toEqual([
      { id: SVC_CORTE.uuid, nombre: 'Corte y degradado a máquina', precio: 16, desde: false, duracion: 30 },
      { id: '88a96e08-1721-413d-855d-e8349ffb4d6a', nombre: 'Corte a tijera y barba', precio: 27, desde: true, duracion: 60 },
      { id: '00000000-0000-4000-8000-000000000001', nombre: 'Corte niño + cejas (rápido)', precio: 10.5, desde: false, duracion: 20 },
    ])
  })

  it('sin separador no oculta nada público', () => {
    expect(aServiciosPublicos([SVC_EXTRA]).map(s => s.id)).toEqual([SVC_EXTRA.uuid])
  })

  it('buscarServicio rechaza extras y ids desconocidos', async () => {
    fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    await expect(buscarServicio(COMMERCE_G, SVC_CORTE.uuid)).resolves.toMatchObject({ uuid: SVC_CORTE.uuid })
    await expect(buscarServicio(COMMERCE_G, SVC_EXTRA.uuid)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS', campos: ['servicio'] })
    await expect(buscarServicio(COMMERCE_G, 'nope')).rejects.toMatchObject({ status: 422 })
  })
})

describe('GET /api/reservas/servicios', () => {
  it('devuelve los servicios de la sede con caché pública', async () => {
    const llamadas = fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=guzman-el-bueno'))
    expect(r.status).toBe(200)
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=600')
    expect((await r.json()).servicios).toHaveLength(3)
    expect(llamadas[0].ruta).toBe('/services/clientweb')
  })

  it('sede desconocida → 422 sin llamar a Yeasy', async () => {
    const llamadas = fetchFalso({})
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=madrid'))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['sede'] })
    expect(llamadas).toHaveLength(0)
  })

  it('Yeasy caído → 503', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchFalso({ 'GET /services/clientweb': () => new Response('', { status: 502 }) })
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=arguelles'))
    expect(r.status).toBe(503)
  })
})
