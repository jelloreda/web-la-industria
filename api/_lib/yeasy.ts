import { ErrorReserva } from './errores'

// Yeasy filtra por huella TLS (nov-2026): el fetch de Node recibe 403 aunque lleve Origin y User-Agent de
// navegador. Las llamadas salen por api/yeasy_proxy.py (curl_cffi, huella de Chrome), que añade Origin,
// x-app-version y el token. Ver CLAUDE.md "Booking API".
const PROXY_PATH = '/api/yeasy_proxy'
const TIMEOUT_MS = 15_000

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

function urlProxy(): string {
  if (process.env.YEASY_PROXY_URL) return process.env.YEASY_PROXY_URL
  // Producción: dominio público (los *.vercel.app de cada despliegue llevan Deployment Protection).
  const host = process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL
  return `${host ? `https://${host}` : 'http://127.0.0.1:3000'}${PROXY_PATH}`
}

export async function yeasy<T>(ruta: string, { method = 'GET', body, auth = false, query }: Opciones = {}): Promise<T> {
  const secreto = process.env.YEASY_PROXY_SECRET
  if (!secreto || (auth && !process.env.YEASY_API_TOKEN)) {
    console.error('[yeasy] falta YEASY_PROXY_SECRET o YEASY_API_TOKEN')
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-proxy-secret': secreto }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

  let res: Response
  try {
    res = await fetch(urlProxy(), {
      method: 'POST', headers,
      body: JSON.stringify({ method, path: ruta, query, body, auth }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    console.error('[yeasy] sin respuesta del proxy', method, ruta)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  if (!res.ok) {
    console.error('[yeasy] proxy respondió', res.status, method, ruta)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  let r: { status?: number; body?: string; error?: string }
  try {
    r = (await res.json()) as typeof r
  } catch {
    console.error('[yeasy] respuesta del proxy ilegible', method, ruta)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  if (r.error || r.status === undefined || r.status < 200 || r.status >= 300) {
    console.error('[yeasy] respuesta', r.status ?? r.error, method, ruta)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  try {
    return JSON.parse(r.body ?? '') as T
  } catch {
    console.error('[yeasy] cuerpo no JSON', method, ruta)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
}
