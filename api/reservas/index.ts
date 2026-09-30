import { errorJson, json, manejarError } from '../_lib/http'
import { crearReserva, validarPeticion } from '../_lib/reservas'

export async function POST(request: Request): Promise<Response> {
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
