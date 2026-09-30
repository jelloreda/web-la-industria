import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearReserva, validarPeticion } from '../api/_lib/reservas'
import { POST } from '../api/reservas/index'
import { fetchFalso, type Manejador } from './helpers/fetch-falso'
import { AHORA, CARLOS, DISPONIBILIDAD_Y, EMPLEADOS_Y, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA, WUILL } from './helpers/datos'

const CLIENTES = [
  { uuid: 'c-1', name: 'Luis', lastname: 'Pérez', phone: '+3461-234-5678', isBlocked: false },
  { uuid: 'c-bloq', name: 'X', phone: '+34699999999', isBlocked: true },
]

function rutas(extra: Record<string, Manejador> = {}) {
  return fetchFalso({
    'GET /services/clientweb': () => SERVICIOS_Y,
    'POST /availability': () => DISPONIBILIDAD_Y,
    'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    'POST /availability/employee': () => true,
    'POST /booking/limit': () => [],
    'GET /customer/commerceAndCreatedBynewV2/.+': () => CLIENTES,
    'POST /customer/commerce': () => ({ uuid: 'c-nuevo', name: 'Álvaro', lastname: 'Martín' }),
    'GET /booking/findBookingsByCommerce/.+': () => [],
    'POST /booking': () => ({ uuid: 'cita-1' }),
    'POST /booking/commerce': () => ({ uuid: 'cita-1' }),
    'POST /push-notification/create-booking': () => ({}),
    ...extra,
  })
}

const peticion = (cambios: Record<string, unknown> = {}) => ({
  sede: 'guzman-el-bueno', servicio: SVC_CORTE.uuid, fecha: '2026-10-01', hora: '17:30', barbero: 'any',
  nombre: 'luis PÉREZ', prefijo: '+34', telefono: '612 345 678', website: '', ...cambios,
})

beforeEach(() => {
  vi.stubEnv('YEASY_API_TOKEN', 't')
  vi.stubEnv('YEASY_USER_UUID_GUZMAN', 'u-g')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('validarPeticion', () => {
  it('normaliza nombre y teléfono', () => {
    const d = validarPeticion(peticion(), AHORA)
    expect(d).toMatchObject({ nombre: 'Luis Pérez', telefono: '+34612345678', fecha: '2026-10-01', hora: '17:30', barbero: 'any' })
  })

  it('el campo trampa relleno se ignora en silencio', () => {
    expect(validarPeticion(peticion({ website: 'http://spam' }), AHORA)).toBe('trampa')
  })

  it('reúne todos los campos inválidos', () => {
    expect(() => validarPeticion(peticion({ sede: 'x', fecha: '2026-10-09', hora: '5pm', nombre: 'Luis', telefono: '123', barbero: 'pepe' }), AHORA))
      .toThrow(expect.objectContaining({ codigo: 'DATOS_INVALIDOS', status: 422, campos: ['sede', 'fecha', 'hora', 'barbero', 'nombre', 'telefono'] }))
    expect(() => validarPeticion({ sede: 1 }, AHORA)).toThrow(expect.objectContaining({ status: 422 }))
  })
})

describe('crearReserva', () => {
  const datos = (cambios: Record<string, unknown> = {}) => validarPeticion(peticion(cambios), AHORA) as Exclude<ReturnType<typeof validarPeticion>, 'trampa'>

  it('cliente existente + "cualquiera": revalida y crea la cita con el primer barber libre', async () => {
    const llamadas = rutas()
    const cita = await crearReserva(datos(), AHORA)
    expect(cita).toEqual({ sede: 'guzman-el-bueno', servicio: 'Corte y degradado a máquina', precio: 16, desde: false, fecha: '2026-10-01', hora: '17:30', duracion: 30, barbero: 'Wuilliams' })
    expect(llamadas.some(l => l.ruta === '/customer/commerce')).toBe(false)
    expect(llamadas.find(l => l.ruta === '/availability/employee')!.cuerpo).toMatchObject({ date: '2026-10-01', hour: 17, minute: 30, employee: WUILL })
    const creada = llamadas.find(l => l.ruta === '/booking' || l.ruta === '/booking/commerce')!
    expect(creada.cuerpo).toMatchObject({ startsDay: '2026-10-01', startsHour: 17, startsMinute: 30, duration: 30, week: 40, year: 2026, asignedTo: WUILL })
  })

  it('cliente nuevo: lo crea con el nombre normalizado', async () => {
    const llamadas = rutas()
    await crearReserva(datos({ nombre: 'álvaro martín', telefono: '611111111' }), AHORA)
    expect(llamadas.find(l => l.ruta === '/customer/commerce')!.cuerpo).toMatchObject({ name: 'Álvaro', lastname: 'Martín', phone: '+34611111111' })
  })

  it('barber concreto', async () => {
    const llamadas = rutas()
    const cita = await crearReserva(datos({ barbero: CARLOS }), AHORA)
    expect(cita.barbero).toBe('Carlos')
    expect(llamadas.find(l => l.ruta === '/availability/employee')!.cuerpo).toMatchObject({ employee: CARLOS })
  })

  it('cliente bloqueado → AGENDA_NO_DISPONIBLE (indistinguible) y no se crea nada', async () => {
    const llamadas = rutas()
    await expect(crearReserva(datos({ telefono: '699999999' }), AHORA)).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE', status: 503 })
    expect(llamadas.some(l => l.metodo === 'POST' && l.ruta.startsWith('/booking'))).toBe(false)
  })

  it('hora que no está libre, o barber que no está libre a esa hora → HUECO_OCUPADO', async () => {
    rutas()
    await expect(crearReserva(datos({ hora: '12:00' }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
    await expect(crearReserva(datos({ hora: '20:30', barbero: CARLOS }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
  })

  it('Yeasy dice que ya no está libre → HUECO_OCUPADO sin crear cliente', async () => {
    const llamadas = rutas({ 'POST /availability/employee': () => false })
    await expect(crearReserva(datos({ telefono: '611111111' }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
    expect(llamadas.some(l => l.ruta === '/customer/commerce')).toBe(false)
  })

  it('solapamiento en /booking/limit → HUECO_OCUPADO', async () => {
    rutas({ 'POST /booking/limit': () => [{ uuid: 'otra' }] })
    await expect(crearReserva(datos(), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
  })

  it('duplicado: si ya tiene esa cita la devuelve sin crear otra ni revalidar', async () => {
    const llamadas = rutas({
      'GET /booking/findBookingsByCommerce/.+': () => [{ uuid: 'ya', startsDay: '2026-10-01', startsHour: 17, startsMinute: 30, isDeleted: false, asignedTo: { name: 'Carlos' } }],
    })
    const cita = await crearReserva(datos(), AHORA)
    expect(cita.barbero).toBe('Carlos')
    expect(llamadas.some(l => l.ruta === '/availability')).toBe(false)
    expect(llamadas.some(l => l.metodo === 'POST' && (l.ruta === '/booking' || l.ruta === '/booking/commerce'))).toBe(false)
  })

  it('/booking/limit con respuesta inesperada → HUECO_OCUPADO (falla cerrado)', async () => {
    rutas({ 'POST /booking/limit': () => ({}) })
    await expect(crearReserva(datos(), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
  })

  it('conflicto en /booking/limit con teléfono nuevo no crea el cliente', async () => {
    const llamadas = rutas({ 'POST /booking/limit': () => [{ uuid: 'otra' }] })
    await expect(crearReserva(datos({ telefono: '611111111' }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
    expect(llamadas.some(l => l.ruta === '/customer/commerce')).toBe(false)
  })

  it('una cita previa cancelada no cuenta como duplicado', async () => {
    const llamadas = rutas({
      'GET /booking/findBookingsByCommerce/.+': () => [{ uuid: 'ya', startsDay: '2026-10-01', startsHour: 17, startsMinute: 30, isDeleted: false, status: 'Cancelada', asignedTo: { name: 'Carlos' } }],
    })
    const cita = await crearReserva(datos(), AHORA)
    expect(cita.barbero).toBe('Wuilliams')
    expect(llamadas.some(l => l.metodo === 'POST' && l.ruta === '/booking')).toBe(true)
  })

  it('token caducado al crear la cita → AGENDA_NO_DISPONIBLE', async () => {
    rutas({ 'POST /booking': () => new Response('', { status: 401 }), 'POST /booking/commerce': () => new Response('', { status: 401 }) })
    await expect(crearReserva(datos(), AHORA)).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE', status: 503 })
  })

  it('no deja reservar un extra', async () => {
    rutas()
    await expect(crearReserva(datos({ servicio: SVC_EXTRA.uuid }), AHORA)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS', campos: ['servicio'] })
  })
})

describe('POST /api/reservas', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(AHORA) })
  afterEach(() => { vi.useRealTimers() })

  const req = (body: unknown) => new Request('http://x/api/reservas', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })

  it('201 con la cita', async () => {
    rutas()
    const r = await POST(req(peticion()))
    expect(r.status).toBe(201)
    expect((await r.json()).cita.hora).toBe('17:30')
  })

  it('campo trampa relleno → 201 sin llamar a Yeasy', async () => {
    const llamadas = fetchFalso({})
    const r = await POST(req(peticion({ website: 'http://spam' })))
    expect(r.status).toBe(201)
    expect(llamadas).toHaveLength(0)
  })

  it('JSON roto → 422', async () => {
    const r = await POST(req('{no json'))
    expect(r.status).toBe(422)
  })

  it('409 HUECO_OCUPADO se propaga', async () => {
    rutas({ 'POST /availability/employee': () => false })
    const r = await POST(req(peticion()))
    expect(r.status).toBe(409)
    expect(await r.json()).toEqual({ error: 'HUECO_OCUPADO' })
  })

  it('el log no incluye el teléfono completo ni el nombre', async () => {
    rutas()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await POST(req(peticion()))
    const texto = info.mock.calls.flat().join(' ')
    expect(texto).not.toContain('612345678')
    expect(texto).not.toContain('Luis')
  })
})
