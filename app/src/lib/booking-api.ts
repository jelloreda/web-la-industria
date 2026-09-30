import type {
  CitaConfirmada, CodigoError, PeticionReserva, RespuestaHuecos, RespuestaServicios,
} from '../../../api/_lib/tipos'

export type {
  BarberoPublico, CitaConfirmada, CodigoError, Franja, HuecoPublico, PeticionReserva,
  RespuestaHuecos, RespuestaServicios, SedeId, ServicioPublico,
} from '../../../api/_lib/tipos'

export class ErrorApi extends Error {
  constructor(public codigo: CodigoError, public campos: string[] = []) {
    super(codigo)
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new ErrorApi('AGENDA_NO_DISPONIBLE')
  }
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) throw new ErrorApi(datos.error ?? 'AGENDA_NO_DISPONIBLE', datos.campos ?? [])
  return datos as T
}

export const api = {
  servicios: (sede: string) =>
    pedir<RespuestaServicios>(`/api/reservas/servicios?${new URLSearchParams({ sede })}`),
  huecos: (sede: string, servicio: string, fecha: string) =>
    pedir<RespuestaHuecos>(`/api/reservas/huecos?${new URLSearchParams({ sede, servicio, fecha })}`),
  reservar: (p: PeticionReserva) =>
    pedir<{ cita: CitaConfirmada }>('/api/reservas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    }),
}
