import { errorJson, json, manejarError } from '../_lib/http'
import { crearReserva, validarPeticion } from '../_lib/reservas'

/** Un navegador siempre manda Origin en un POST: si no es esta misma web, la petición viene de otra página. */
function origenAjeno(request: Request): boolean {
  const origen = request.headers.get('origin')
  if (!origen) return false
  try {
    return new URL(origen).host !== new URL(request.url).host
  } catch {
    return true
  }
}

export async function POST(request: Request): Promise<Response> {
  if (origenAjeno(request)) return errorJson('DATOS_INVALIDOS', 403)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorJson('DATOS_INVALIDOS', 422, ['body'])
  }
  try {
    const ahora = new Date()
    const datos = validarPeticion(body, ahora)
    if (datos === 'trampa') return json({ cita: null }, 201)
    const cita = await crearReserva(datos, ahora)
    console.info('[reservas] cita creada', datos.sede.id, datos.fecha, datos.hora, `tel …${datos.telefono.slice(-3)}`)
    return json({ cita }, 201)
  } catch (e) {
    return manejarError(e)
  }
}
