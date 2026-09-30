import type { BarberoPublico, Franja, HuecoPublico, RespuestaHuecos } from './tipos'
import { yeasy, type YDisponibilidad, type YEmpleado, type YServicio } from './yeasy'

const FRANJAS: Array<['morning' | 'afternoon' | 'evening', Franja]> = [
  ['morning', 'manana'], ['afternoon', 'tarde'], ['evening', 'noche'],
]

export function fotoCloudinary(url?: string | null): string | null {
  if (!url) return null
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/c_fill,g_face,w_200,h_200,q_80/')
    : url
}

export function esPersonalReservable(e: YEmpleado): boolean {
  return !/admin/i.test(e.position ?? '')
}

export function aHuecosPublicos(fecha: string, disp: YDisponibilidad[], empleados: YEmpleado[], ahora: Date): RespuestaHuecos {
  const reservables = new Map(empleados.filter(esPersonalReservable).map(e => [e.uuid, e]))
  const porHora = new Map<string, { date: string; franja: Franja; barberos: string[] }>()
  const barberos: BarberoPublico[] = []

  for (const entrada of Array.isArray(disp) ? disp : []) {
    const emp = reservables.get(entrada.employee?.uuid)
    if (!emp) continue
    let tieneHuecos = false
    for (const [clave, franja] of FRANJAS) {
      for (const h of entrada.availability?.[clave] ?? []) {
        if (new Date(h.date).getTime() <= ahora.getTime()) continue
        tieneHuecos = true
        const actual = porHora.get(h.label) ?? { date: h.date, franja, barberos: [] }
        if (!actual.barberos.includes(emp.uuid)) actual.barberos.push(emp.uuid)
        porHora.set(h.label, actual)
      }
    }
    if (tieneHuecos) barberos.push({ id: emp.uuid, nombre: emp.name.trim(), foto: fotoCloudinary(emp.image) })
  }

  const huecos: HuecoPublico[] = [...porHora.entries()]
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .map(([hora, v]) => ({ hora, franja: v.franja, barberos: v.barberos }))

  return { fecha, barberos, huecos }
}

export async function disponibilidad(commerceUuid: string, fecha: string, servicio: YServicio): Promise<YDisponibilidad[]> {
  const r = await yeasy<unknown>('/availability', {
    method: 'POST',
    body: {
      commerce: commerceUuid, date: fecha,
      servicesDuration: servicio.defaultDuration, serviceCollection: [servicio],
      userTimezone: 'Europe/Madrid',
    },
  })
  return Array.isArray(r) ? (r as YDisponibilidad[]) : []
}

export function empleadosDeSede(commerceUuid: string): Promise<YEmpleado[]> {
  return yeasy<YEmpleado[]>(`/employee/commerce/${commerceUuid}`)
}
