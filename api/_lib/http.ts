import { ErrorReserva } from './errores'
import type { CodigoError } from './tipos'

export function json(data: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

export function errorJson(error: CodigoError, status: number, campos?: string[]): Response {
  return json(campos && campos.length ? { error, campos } : { error }, status)
}

export function manejarError(e: unknown): Response {
  if (e instanceof ErrorReserva) return errorJson(e.codigo, e.status, e.campos)
  console.error('[reservas] error inesperado', e instanceof Error ? e.message : String(e))
  return errorJson('AGENDA_NO_DISPONIBLE', 503)
}
