import type { YDisponibilidad, YEmpleado, YServicio } from '../../api/_lib/yeasy'

export const COMMERCE_G = '6f554a4a-15ea-4752-9ea5-985791a6c972'
/** Jueves 1 oct 2026, 09:00 en Madrid */
export const AHORA = new Date('2026-10-01T07:00:00Z')

const svc = (uuid: string, name: string, price: number, defaultDuration: number, order: number, extra: Partial<YServicio> = {}): YServicio =>
  ({ uuid, name, price, decimal: 0, defaultDuration, order, isPublic: true, isDeleted: false, ...extra })

export const SVC_CORTE = svc('5029b0af-bd81-424d-bb85-8043fae859ea', 'Corte y Degradado a Maquina', 16, 30, 0)
export const SVC_TIJERA = svc('88a96e08-1721-413d-855d-e8349ffb4d6a', 'Corte Tijera y Barba desde ', 27, 60, 4)
export const SVC_NUEVO = svc('00000000-0000-4000-8000-000000000001', 'corte  niño+cejas(rápido)', 10, 20, 5, { decimal: 50 })
export const SVC_OCULTO = svc('00000000-0000-4000-8000-000000000002', 'Interno', 0, 30, 6, { isPublic: false })
export const SVC_BORRADO = svc('00000000-0000-4000-8000-000000000005', 'Viejo', 5, 30, 7, { isDeleted: true })
export const SVC_SEPARADOR = svc('00000000-0000-4000-8000-000000000003', '⬇️⬇️Extras ⬇️⬇️', 0, 15, 16)
export const SVC_EXTRA = svc('00000000-0000-4000-8000-000000000004', 'Cejas con pinza', 8, 15, 17)
/** Desordenados a propósito */
export const SERVICIOS_Y: YServicio[] = [SVC_EXTRA, SVC_TIJERA, SVC_SEPARADOR, SVC_CORTE, SVC_OCULTO, SVC_BORRADO, SVC_NUEVO]

export const CARLOS = '62db04ed-4eea-4b2e-8aff-f1e85a0e7cff'
export const WUILL = 'b08264da-ff25-43b1-83bf-c66b8c9670c0'
export const ADMIN = '5edbd80e-37e9-41ae-8c93-abab62be1d18'

export const EMPLEADOS_Y: YEmpleado[] = [
  { uuid: WUILL, name: 'Wuilliams', position: 'Barbero', image: 'https://res.cloudinary.com/df0dan3od/image/upload/v1/employees/w.jpg' },
  { uuid: CARLOS, name: 'Carlos ', position: '', image: null },
  { uuid: ADMIN, name: 'Admin', position: 'Admin', image: '' },
]

const hueco = (date: string, label: string, ...ids: string[]) => ({ date, label, employee: ids.map(uuid => ({ uuid, name: 'x' })) })

/** Disponibilidad del jueves 1 oct 2026 */
export const DISPONIBILIDAD_Y: YDisponibilidad[] = [
  { employee: { uuid: 'all', name: 'Cualquiera' }, availability: { morning: [hueco('2026-10-01T08:00:00.000Z', '10:00', CARLOS)], afternoon: [], evening: [] } },
  { employee: { uuid: WUILL, name: 'Wuilliams' }, availability: { morning: [], afternoon: [hueco('2026-10-01T15:30:00.000Z', '17:30', WUILL)], evening: [hueco('2026-10-01T18:30:00.000Z', '20:30', WUILL)] } },
  { employee: { uuid: CARLOS, name: 'Carlos' }, availability: {
    morning: [hueco('2026-10-01T06:30:00.000Z', '8:30', CARLOS), hueco('2026-10-01T08:00:00.000Z', '10:00', CARLOS)],
    afternoon: [hueco('2026-10-01T15:30:00.000Z', '17:30', CARLOS)],
    evening: [],
  } },
  { employee: { uuid: ADMIN, name: 'Admin' }, availability: { morning: [hueco('2026-10-01T09:00:00.000Z', '11:00', ADMIN)] } },
]
