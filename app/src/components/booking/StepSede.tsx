import { ArrowRight } from 'lucide-react'
import { BOOKING_MODE, LOCATIONS, type Location } from '@/lib/brand'
import type { Accion } from './estado'
import { Cuerpo } from './piezas'

export function StepSede({ dispatch }: { dispatch: (a: Accion) => void }) {
  const elegir = (l: Location) => {
    if (BOOKING_MODE === 'yeasy') {
      window.open(l.bookingUrl, '_blank', 'noopener,noreferrer')
      return
    }
    dispatch({ tipo: 'elegirSede', sedeId: l.id })
  }

  return (
    <Cuerpo>
      <div className="flex flex-col gap-2.5">
        <p className="mb-1.5 font-work-sans text-[13px] leading-relaxed text-arena">
          Cada sede lleva su propia agenda. Elige dónde quieres cortarte.
        </p>
        {LOCATIONS.map(l => (
          <button
            key={l.id}
            type="button"
            data-testid={`picker-${l.id}`}
            onClick={() => elegir(l)}
            className="group flex items-center gap-4 px-4 py-5 bg-dark2 border border-cream/10 hover:border-cream/40 text-left transition-colors"
          >
            <span className="grow flex flex-col gap-1.5">
              <span className="flex items-center gap-2.5">
                <span className="font-coolvetica text-xl leading-none uppercase text-cream">{l.name}</span>
                {l.isNew && (
                  <span className="px-2 py-1 bg-cream text-carbon font-work-sans font-bold text-[8px] uppercase tracking-[0.3em]">Nueva</span>
                )}
              </span>
              <span className="font-work-sans text-xs text-arena">{l.shortAddress}</span>
            </span>
            <ArrowRight size={16} strokeWidth={1.5} className="text-cream group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </Cuerpo>
  )
}
