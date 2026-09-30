import { errorJson, json, manejarError } from '../_lib/http'
import { sedePorId } from '../_lib/sedes'
import { aServiciosPublicos, serviciosDeSede } from '../_lib/servicios'

export async function GET(request: Request): Promise<Response> {
  const sede = sedePorId(new URL(request.url).searchParams.get('sede'))
  if (!sede) return errorJson('DATOS_INVALIDOS', 422, ['sede'])
  try {
    const servicios = aServiciosPublicos(await serviciosDeSede(sede.commerceUuid))
    return json({ servicios }, 200, 'public, s-maxage=300, stale-while-revalidate=600')
  } catch (e) {
    return manejarError(e)
  }
}
