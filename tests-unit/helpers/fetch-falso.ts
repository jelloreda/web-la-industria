import { vi } from 'vitest'

export type Manejador = (url: URL, cuerpo: unknown) => unknown
export interface Llamada { metodo: string; ruta: string; cuerpo: unknown; headers: Record<string, string> }

/**
 * Sustituye fetch. Las claves son regex sobre "MÉTODO /ruta", p. ej. 'GET /employee/commerce/.+'.
 * Si el manejador devuelve un Response se usa tal cual; si no, se serializa como JSON 200.
 */
export function fetchFalso(rutas: Record<string, Manejador>): Llamada[] {
  const llamadas: Llamada[] = []
  vi.stubGlobal('fetch', vi.fn(async (entrada: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(entrada))
    const metodo = init.method ?? 'GET'
    const cuerpo = init.body ? JSON.parse(String(init.body)) : undefined
    llamadas.push({ metodo, ruta: url.pathname, cuerpo, headers: (init.headers ?? {}) as Record<string, string> })
    const clave = `${metodo} ${url.pathname}`
    const ruta = Object.entries(rutas).find(([patron]) => new RegExp(`^${patron}$`).test(clave))
    if (!ruta) return new Response('no encontrado', { status: 404 })
    const r = ruta[1](url, cuerpo)
    return r instanceof Response ? r : new Response(JSON.stringify(r), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
  return llamadas
}
