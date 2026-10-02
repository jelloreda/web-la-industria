import { z } from 'zod'
import { buscarClientePorTelefono, crearCliente } from './clientes'
import { ErrorReserva } from './errores'
import { esFechaReservable, fechaMadrid, semanaIso } from './fecha'
import { aHuecosPublicos, disponibilidad, empleadosDeSede } from './huecos'
import { nombreValido, normalizarNombre } from './nombres'
import { sedePorId, type SedeYeasy } from './sedes'
import { aServiciosPublicos, buscarServicio } from './servicios'
import { aE164 } from './telefono'
import type { CitaConfirmada } from './tipos'
import { yeasy, type YCita, type YCliente, type YServicio } from './yeasy'

/** Decidido en la Tarea 0: 'cliente' = POST /booking como la web de Yeasy; 'comercio' = POST /booking/commerce como el MCP. */
export const MODO_CITA: 'cliente' | 'comercio' = 'cliente'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface DatosReserva {
  sede: SedeYeasy
  servicioId: string
  fecha: string
  hora: string
  barbero: string
  nombre: string
  telefono: string
}

const Esquema = z.object({
  sede: z.string(), servicio: z.string(), fecha: z.string(), hora: z.string(), barbero: z.string(),
  nombre: z.string(), prefijo: z.string(), telefono: z.string(), website: z.string().optional(),
})

export function validarPeticion(body: unknown, ahora: Date): DatosReserva | 'trampa' {
  const r = Esquema.safeParse(body)
  if (!r.success) {
    throw new ErrorReserva('DATOS_INVALIDOS', 422, [...new Set(r.error.issues.map(i => String(i.path[0] ?? 'body')))])
  }
  const p = r.data
  if (p.website) return 'trampa'

  const sede = sedePorId(p.sede)
  const nombre = normalizarNombre(p.nombre)
  const telefono = aE164(p.prefijo, p.telefono)
  const campos: string[] = []
  if (!sede) campos.push('sede')
  if (!UUID.test(p.servicio)) campos.push('servicio')
  if (!esFechaReservable(p.fecha, ahora)) campos.push('fecha')
  if (!/^\d{1,2}:\d{2}$/.test(p.hora)) campos.push('hora')
  if (p.barbero !== 'any' && !UUID.test(p.barbero)) campos.push('barbero')
  if (!nombreValido(nombre)) campos.push('nombre')
  if (!telefono) campos.push('telefono')
  if (campos.length || !sede || !telefono) throw new ErrorReserva('DATOS_INVALIDOS', 422, campos)

  return { sede, servicioId: p.servicio, fecha: p.fecha, hora: p.hora, barbero: p.barbero, nombre, telefono }
}

function aCita(d: DatosReserva, servicio: YServicio, barbero: string): CitaConfirmada {
  const publico = aServiciosPublicos([servicio])[0]
  return {
    sede: d.sede.id, servicio: publico.nombre, precio: publico.precio, desde: publico.desde,
    fecha: d.fecha, hora: d.hora, duracion: servicio.defaultDuration, barbero,
  }
}

const CITA_ANULADA = /cancel|anul|no.?show|rechaz/i

/** Citas futuras activas que puede tener un mismo teléfono: frena que alguien ocupe la agenda con un solo número. */
export const MAX_CITAS_FUTURAS = 2

async function citasActivas(commerceUuid: string, clienteUuid: string): Promise<YCita[]> {
  const citas = await yeasy<YCita[]>(`/booking/findBookingsByCommerce/${commerceUuid}/customer/${clienteUuid}`, { auth: true })
  return (Array.isArray(citas) ? citas : []).filter(c => !c.isDeleted && !CITA_ANULADA.test(c.status ?? ''))
}

function cuerpoCitaCliente(d: DatosReserva, servicio: YServicio, cliente: YCliente, barberoId: string, hour: number, minute: number) {
  const { week, year } = semanaIso(d.fecha)
  return {
    commerce: d.sede.commerceUuid, customer: cliente.uuid, week, year, commerceSettedUuid: d.sede.commerceUuid,
    startsDay: d.fecha, startsHour: hour, startsMinute: minute, chargeId: null, subsCode: '', inasistanceValue: 0,
    paymentMethod: null, paymentSettedUuid: '', duration: servicio.defaultDuration, message: '',
    asignedTo: barberoId, service: [servicio], status: 'Pendiente', createdBy: '', createdUUID: cliente.uuid,
    createdByType: 'customer', isDeleted: false, customerSelected: d.barbero !== 'any', source: 'web',
  }
}

function cuerpoCitaComercio(d: DatosReserva, servicio: YServicio, cliente: YCliente, barberoId: string, hour: number, minute: number) {
  const { week, year } = semanaIso(d.fecha)
  return {
    commerce: d.sede.commerceUuid, commerceSettedUuid: d.sede.commerceUuid,
    customer: { uuid: cliente.uuid, name: cliente.name, lastname: cliente.lastname ?? '', phone: cliente.phone ?? '', email: cliente.email ?? '' },
    service: [servicio], asignedTo: barberoId, year, week, startsDay: d.fecha, startsHour: hour, startsMinute: minute,
    duration: servicio.defaultDuration, message: '', note: 'Reserva desde la web', status: 'Pendiente', createdByType: 'employee',
  }
}

export async function crearReserva(d: DatosReserva, ahora: Date): Promise<CitaConfirmada> {
  const commerce = d.sede.commerceUuid
  const [hour, minute] = d.hora.split(':').map(Number)
  const servicio = await buscarServicio(commerce, d.servicioId)

  const existente = await buscarClientePorTelefono(commerce, d.telefono)
  if (existente?.isBlocked) throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  if (existente) {
    const citas = await citasActivas(commerce, existente.uuid)
    const previa = citas.find(c => c.startsDay === d.fecha && c.startsHour === hour && c.startsMinute === minute)
    if (previa) return aCita(d, servicio, previa.asignedTo?.name?.trim() ?? '')
    const hoy = fechaMadrid(ahora)
    if (citas.filter(c => c.startsDay >= hoy).length >= MAX_CITAS_FUTURAS) throw new ErrorReserva('NO_DISPONIBLE', 429)
  }

  const [disp, empleados] = await Promise.all([disponibilidad(commerce, d.fecha, servicio), empleadosDeSede(commerce)])
  const { huecos, barberos } = aHuecosPublicos(d.fecha, disp, empleados, ahora)
  const hueco = huecos.find(h => h.hora === d.hora)
  const barberoId = d.barbero === 'any' ? hueco?.barberos[0] : hueco?.barberos.find(id => id === d.barbero)
  if (!hueco || !barberoId) throw new ErrorReserva('HUECO_OCUPADO', 409)

  const libre = await yeasy<boolean>('/availability/employee', {
    method: 'POST', auth: true,
    body: { date: d.fecha, hour, minute, employee: barberoId, servicesDuration: servicio.defaultDuration, serviceCollection: [servicio], userTimezone: 'Europe/Madrid' },
  })
  const conflictos = await yeasy<unknown[]>('/booking/limit', {
    method: 'POST', auth: true,
    body: { duration: servicio.defaultDuration, hour, minute, date: d.fecha, employee: { uuid: barberoId }, commerce: { uuid: commerce } },
  })
  if (libre !== true || !Array.isArray(conflictos) || conflictos.length > 0) throw new ErrorReserva('HUECO_OCUPADO', 409)

  const cliente = existente ?? await crearCliente(d.sede, d.nombre, d.telefono)

  if (MODO_CITA === 'cliente') {
    await yeasy('/booking', { method: 'POST', auth: true, body: cuerpoCitaCliente(d, servicio, cliente, barberoId, hour, minute) })
  } else {
    const creada = await yeasy('/booking/commerce', { method: 'POST', auth: true, body: cuerpoCitaComercio(d, servicio, cliente, barberoId, hour, minute) })
    try {
      await yeasy('/push-notification/create-booking', { method: 'POST', auth: true, body: [creada] })
    } catch {
      // La cita ya existe; un fallo de notificación no la deshace.
    }
  }

  const barbero = barberos.find(b => b.id === barberoId)?.nombre ?? ''
  return aCita(d, servicio, barbero)
}
