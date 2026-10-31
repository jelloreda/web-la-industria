import { expect, vi } from 'vitest'

export type Manejador = (url: URL, cuerpo: unknown) => unknown
export interface Llamada { metodo: string; ruta: string; cuerpo: unknown; headers: Record<string, string> }

/**
 * Sustituye fetch. Las claves son regex sobre "MÉTODO /ruta", p. ej. 'GET /employee/commerce/.+'.
 * Si el manejador devuelve un Response se usa tal cual; si no, se serializa como JSON 200.
 * Las funciones llaman a Yeasy a través de /api/yeasy_proxy: el helper hace de proxy, desempaqueta
 * {method, path, query, body, auth} y responde {status, body} como lo haría api/yeasy_proxy.py.
 * `headers` de cada llamada = cabeceras que Node manda al proxy + `auth` (si pidió el token).
 */
export function fetchFalso(rutas: Record<string, Manejador>): Llamada[] {
  const llamadas: Llamada[] = []
  vi.stubGlobal('fetch', vi.fn(async (entrada: string | URL, init: RequestInit = {}) => {
    const proxy = JSON.parse(String(init.body)) as { method: string; path: string; query?: Record<string, string>; body?: unknown; auth?: boolean }
    const url = new URL(proxy.path, 'https://api.yeasy.io')
    for (const [k, v] of Object.entries(proxy.query ?? {})) url.searchParams.set(k, v)
    expect(new URL(String(entrada)).pathname).toBe('/api/yeasy_proxy')
    const headers = { ...(init.headers as Record<string, string>), auth: String(Boolean(proxy.auth)) }
    llamadas.push({ metodo: proxy.method, ruta: url.pathname, cuerpo: proxy.body, headers })
    const clave = `${proxy.method} ${url.pathname}`
    const ruta = Object.entries(rutas).find(([patron]) => new RegExp(`^${patron}$`).test(clave))
    const responder = (r: unknown) => {
      if (r instanceof Response) return r.text().then(body => ({ status: r.status, body }))
      return Promise.resolve({ status: 200, body: JSON.stringify(r) })
    }
    const salida = ruta ? await responder(ruta[1](url, proxy.body)) : { status: 404, body: 'no encontrado' }
    return new Response(JSON.stringify(salida), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
  return llamadas
}
