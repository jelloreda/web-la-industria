import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aHuecosPublicos, fotoCloudinary } from '../api/_lib/huecos'
import { GET } from '../api/reservas/huecos'
import { fetchFalso } from './helpers/fetch-falso'
import { AHORA, CARLOS, DISPONIBILIDAD_Y, EMPLEADOS_Y, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA, WUILL } from './helpers/datos'

describe('aHuecosPublicos', () => {
  it('agrupa por hora, quita huecos pasados, al personal admin y la entrada "all"', () => {
    expect(aHuecosPublicos('2026-10-01', DISPONIBILIDAD_Y, EMPLEADOS_Y, AHORA)).toEqual({
      fecha: '2026-10-01',
      barberos: [
        { id: WUILL, nombre: 'Wuilliams', foto: 'https://res.cloudinary.com/df0dan3od/image/upload/c_fill,g_face,w_200,h_200,q_80/v1/employees/w.jpg' },
        { id: CARLOS, nombre: 'Carlos', foto: null },
      ],
      huecos: [
        { hora: '10:00', franja: 'manana', barberos: [CARLOS] },
        { hora: '17:30', franja: 'tarde', barberos: [WUILL, CARLOS] },
        { hora: '20:30', franja: 'noche', barberos: [WUILL] },
      ],
    })
  })

  it('un barber sin huecos ese día no aparece', () => {
    const soloCarlos = DISPONIBILIDAD_Y.filter(d => d.employee.uuid !== WUILL)
    expect(aHuecosPublicos('2026-10-01', soloCarlos, EMPLEADOS_Y, AHORA).barberos.map(b => b.id)).toEqual([CARLOS])
  })

  it('a última hora del día no queda nada', () => {
    const tarde = new Date('2026-10-01T19:00:00Z')
    expect(aHuecosPublicos('2026-10-01', DISPONIBILIDAD_Y, EMPLEADOS_Y, tarde)).toEqual({ fecha: '2026-10-01', barberos: [], huecos: [] })
  })

  it('las fotos solo se transforman si son de Cloudinary', () => {
    expect(fotoCloudinary('')).toBeNull()
    expect(fotoCloudinary('https://otro.com/a.jpg')).toBe('https://otro.com/a.jpg')
  })

  it('contrato: la disponibilidad real capturada se mapea sin romperse', () => {
    const disp = JSON.parse(fs.readFileSync('tests-unit/fixtures/disponibilidad-guzman.json', 'utf8'))
    const emps = JSON.parse(fs.readFileSync('tests-unit/fixtures/empleados-guzman.json', 'utf8'))
    const r = aHuecosPublicos('2099-01-01', disp, emps, new Date(0))
    expect(r.barberos.every(b => b.id !== 'all' && !/admin/i.test(b.nombre))).toBe(true)
    expect(r.huecos.every(h => /^\d{1,2}:\d{2}$/.test(h.hora) && h.barberos.length > 0)).toBe(true)
  })
})

describe('GET /api/reservas/huecos', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(AHORA) })
  afterEach(() => { vi.useRealTimers() })

  const url = (q: string) => new Request(`http://x/api/reservas/huecos?${q}`)

  it('pide /availability (no v2) con el servicio de Yeasy y responde huecos', async () => {
    const llamadas = fetchFalso({
      'GET /services/clientweb': () => SERVICIOS_Y,
      'POST /availability': () => DISPONIBILIDAD_Y,
      'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-01`))
    expect(r.status).toBe(200)
    expect((await r.json()).huecos).toHaveLength(3)
    const pedido = llamadas.find(l => l.ruta === '/availability')!
    expect(pedido.cuerpo).toMatchObject({ date: '2026-10-01', servicesDuration: 30, userTimezone: 'Europe/Madrid', serviceCollection: [SVC_CORTE] })
    expect(llamadas.some(l => l.ruta === '/availability/v2')).toBe(false)
  })

  it('fecha fuera del rango de 7 días → 422', async () => {
    const llamadas = fetchFalso({})
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-08`))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['fecha'] })
    expect(llamadas).toHaveLength(0)
  })

  it('un extra no se puede consultar → 422 servicio', async () => {
    fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_EXTRA.uuid}&fecha=2026-10-01`))
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['servicio'] })
  })

  it('si Yeasy no devuelve un array se trata como día sin huecos', async () => {
    fetchFalso({
      'GET /services/clientweb': () => SERVICIOS_Y,
      'POST /availability': () => ({ message: 'cerrado' }),
      'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-04`))
    expect(await r.json()).toEqual({ fecha: '2026-10-04', barberos: [], huecos: [] })
  })
})
