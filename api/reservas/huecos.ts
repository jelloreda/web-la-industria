import { esFechaReservable } from '../_lib/fecha'
import { errorJson, json, manejarError } from '../_lib/http'
import { aHuecosPublicos, disponibilidad, empleadosDeSede } from '../_lib/huecos'
import { sedePorId } from '../_lib/sedes'
import { buscarServicio } from '../_lib/servicios'

export async function GET(request: Request): Promise<Response> {
  const p = new URL(request.url).searchParams
  const sede = sedePorId(p.get('sede'))
  const servicioId = p.get('servicio') ?? ''
  const fecha = p.get('fecha') ?? ''
  const ahora = new Date()

  const campos = [
    !sede && 'sede',
    !servicioId && 'servicio',
    !esFechaReservable(fecha, ahora) && 'fecha',
  ].filter((c): c is string => Boolean(c))
  if (campos.length || !sede) return errorJson('DATOS_INVALIDOS', 422, campos)

  try {
    const servicio = await buscarServicio(sede.commerceUuid, servicioId)
    const [disp, empleados] = await Promise.all([
      disponibilidad(sede.commerceUuid, fecha, servicio),
      empleadosDeSede(sede.commerceUuid),
    ])
    return json(aHuecosPublicos(fecha, disp, empleados, ahora), 200, 'public, s-maxage=5')
  } catch (e) {
    return manejarError(e)
  }
}
