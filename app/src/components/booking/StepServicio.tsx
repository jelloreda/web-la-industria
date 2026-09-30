import { api, type SedeId } from '@/lib/booking-api'
import { LOCATIONS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { Accion } from './estado'
import { euros } from './formato'
import { AvisoError, Cuerpo, Esqueleto, TEXTO_ERROR_CARGA } from './piezas'
import { useCarga } from './useCarga'

export function StepServicio({ sedeId, actual, dispatch }: { sedeId: SedeId; actual: string | null; dispatch: (a: Accion) => void }) {
  const sede = LOCATIONS.find(l => l.id === sedeId)!
  const [carga, reintentar] = useCarga(`servicios:${sedeId}`, () => api.servicios(sedeId))

  return (
    <Cuerpo>
      {carga.tipo === 'cargando' && (
        <div aria-label="Cargando servicios" className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-[72px]" />)}
        </div>
      )}
      {carga.tipo === 'error' && <AvisoError texto={TEXTO_ERROR_CARGA} onReintentar={reintentar} whatsappUrl={sede.whatsappUrl} />}
      {carga.tipo === 'ok' && (
        <ul className="flex flex-col gap-2">
          {carga.datos.servicios.map(s => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => dispatch({ tipo: 'elegirServicio', servicio: s })}
                className={cn(
                  'w-full min-h-16 flex items-center gap-4 px-4 py-3.5 bg-dark2 border text-left transition-colors',
                  s.id === actual ? 'border-cream' : 'border-cream/10 hover:border-cream/40',
                )}
              >
                <span className="grow min-w-0 flex flex-col gap-1">
                  <span className="font-work-sans font-medium text-sm leading-snug text-cream">{s.nombre}</span>
                  <span className="font-work-sans text-[11px] tracking-wide text-arena">{s.duracion} min</span>
                </span>
                <span className="shrink-0 font-coolvetica text-xl leading-none text-cream">{euros(s.precio, s.desde)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Cuerpo>
  )
}
