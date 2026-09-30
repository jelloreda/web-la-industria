import { useCallback, useEffect, useState } from 'react'
import { ErrorApi } from '@/lib/booking-api'

export type Carga<T> = { tipo: 'cargando' } | { tipo: 'error'; error: ErrorApi } | { tipo: 'ok'; datos: T }

// Caché mientras el panel está abierto; BookingProvider la vacía al cerrar.
const cache = new Map<string, unknown>()

export function limpiarCache() {
  cache.clear()
}

export function useCarga<T>(clave: string, cargar: () => Promise<T>): [Carga<T>, () => void] {
  const [intento, setIntento] = useState(0)
  const [carga, setCarga] = useState<Carga<T>>(() =>
    cache.has(clave) ? { tipo: 'ok', datos: cache.get(clave) as T } : { tipo: 'cargando' })

  useEffect(() => {
    if (cache.has(clave)) {
      setCarga({ tipo: 'ok', datos: cache.get(clave) as T })
      return
    }
    let vivo = true
    setCarga({ tipo: 'cargando' })
    cargar()
      .then(datos => {
        cache.set(clave, datos)
        if (vivo) setCarga({ tipo: 'ok', datos })
      })
      .catch(err => {
        if (vivo) setCarga({ tipo: 'error', error: err instanceof ErrorApi ? err : new ErrorApi('AGENDA_NO_DISPONIBLE') })
      })
    return () => { vivo = false }
    // `cargar` cambia en cada render; la clave identifica la petición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  const reintentar = useCallback(() => {
    cache.delete(clave)
    setIntento(i => i + 1)
  }, [clave])

  return [carga, reintentar]
}
