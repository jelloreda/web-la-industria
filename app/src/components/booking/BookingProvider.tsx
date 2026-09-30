import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { BOOKING_MODE, LOCATIONS, type SedeId } from '@/lib/brand'
import { rangoReservable } from '../../../../api/_lib/fecha'
import { BookingPanel } from './BookingPanel'
import { estadoInicial, reducir, type Accion } from './estado'
import { limpiarCache } from './useCarga'

interface BookingContextValue { open: (sedeId?: SedeId) => void }

const BookingContext = createContext<BookingContextValue>({ open: () => {} })

/** `open()` pregunta la sede; `open(sedeId)` va directo a sus servicios. */
export function useBooking() {
  return useContext(BookingContext)
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reducir, estadoInicial)

  const dispatch = useCallback((a: Accion) => {
    if (a.tipo === 'cerrar') limpiarCache()
    despachar(a)
  }, [])

  const open = useCallback((sedeId?: SedeId) => {
    const sede = LOCATIONS.find(l => l.id === sedeId)
    if (BOOKING_MODE === 'yeasy' && sede) {
      window.open(sede.bookingUrl, '_blank', 'noopener,noreferrer')
      return
    }
    dispatch({ tipo: 'abrir', sedeId, hoy: rangoReservable(new Date())[0] })
  }, [dispatch])

  const value = useMemo(() => ({ open }), [open])

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingPanel estado={estado} dispatch={dispatch} />
    </BookingContext.Provider>
  )
}
