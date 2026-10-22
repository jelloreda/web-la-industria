import { ErrorReserva } from './errores'

export const YEASY_API = 'https://api.yeasy.io'
export const YEASY_ORIGIN = 'https://app.yeasy.io'
// Same User-Agent the Yeasy web app sends (copied from a browser HAR, Oct 2026). Yeasy answers 403
// to User-Agents that don't look like a browser: axios' default, and since 22-Oct also our own
// 'laindustria-web/1.0', which had worked for days. A browser UA is the only one never rejected.
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36'
const TIMEOUT_MS = 10_000

export interface YServicio {
  uuid: string; name: string; price: number; decimal: number; defaultDuration: number
  order: number; isPublic: boolean; isDeleted?: boolean
  [otro: string]: unknown
}
export interface YEmpleado { uuid: string; name: string; position?: string; image?: string | null }
export interface YHueco { date: string; label: string; employee: Array<{ uuid: string; name?: string }> }
export interface YDisponibilidad {
  employee: { uuid: string; name: string; image?: string | null }
  availability?: { morning?: YHueco[]; afternoon?: YHueco[]; evening?: YHueco[] }
}
export interface YCliente {
  uuid: string; name: string; lastname?: string; phone?: string | null; email?: string
  isBlocked?: boolean; isDeleted?: boolean
}
export interface YCita {
  uuid: string; startsDay: string; startsHour: number; startsMinute: number
  isDeleted?: boolean; status?: string; asignedTo?: { name?: string } | null
}

interface Opciones {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  auth?: boolean
  query?: Record<string, string>
}

export async function yeasy<T>(ruta: string, { method = 'GET', body, auth = false, query }: Opciones = {}): Promise<T> {
  const url = new URL(ruta, YEASY_API)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)

  // Yeasy answers 403 without this Origin since Oct 2026 (same token goes 403→200 by adding it)
  // and also rejects non-browser User-Agents (axios', and our own). See CLAUDE.md "Booking API".
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-app-version': '2.1.0',
    Origin: YEASY_ORIGIN,
    'User-Agent': USER_AGENT,
  }
  if (auth) {
    const token = process.env.YEASY_API_TOKEN
    if (!token) {
      console.error('[yeasy] falta YEASY_API_TOKEN')
      throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
    }
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(url, {
      method, headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    console.error('[yeasy] sin respuesta', method, url.pathname)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  if (!res.ok) {
    console.error('[yeasy] respuesta', res.status, method, url.pathname)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  try {
    return (await res.json()) as T
  } catch {
    console.error('[yeasy] cuerpo no JSON', method, url.pathname)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
}
