import { useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, X } from 'lucide-react'
import { LOCATIONS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { Accion, EstadoReserva } from './estado'
import { StepConfirmacion } from './StepConfirmacion'
import { StepDatos } from './StepDatos'
import { StepHueco } from './StepHueco'
import { StepSede } from './StepSede'
import { StepServicio } from './StepServicio'

const TITULOS = ['Elige tu sede', 'Elige servicio', 'Día y hora', 'Tus datos', 'Cita reservada']
const PASOS = ['Servicio', 'Día y hora', 'Tus datos']

const botonIcono = 'w-11 h-11 shrink-0 flex items-center justify-center border border-cream/10 text-arena hover:text-cream transition-colors'

export function BookingPanel({ estado, dispatch }: { estado: EstadoReserva; dispatch: (a: Accion) => void }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const sede = LOCATIONS.find(l => l.id === estado.sedeId)
  const conPasos = estado.paso >= 1 && estado.paso <= 3

  useEffect(() => {
    if (estado.abierto) titulo.current?.focus()
  }, [estado.paso, estado.abierto])

  return (
    <Dialog.Root open={estado.abierto} onOpenChange={abierto => { if (!abierto) dispatch({ tipo: 'cerrar' }) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content
          data-testid="booking-panel"
          aria-describedby={undefined}
          onOpenAutoFocus={e => { e.preventDefault(); titulo.current?.focus() }}
          className="fixed z-50 inset-0 flex flex-col bg-carbon text-cream md:left-auto md:w-[480px] md:border-l md:border-cream/10"
        >
          <header className="shrink-0 flex flex-col gap-3.5 px-5 pt-3 pb-4 border-b border-[#4a4948]">
            <span aria-hidden className="self-center block w-10 h-[3px] bg-gray-stone md:hidden" />
            <div className="flex items-center justify-between gap-2">
              {conPasos ? (
                <button type="button" aria-label="Volver" onClick={() => dispatch({ tipo: 'volver' })} className={botonIcono}>
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
              ) : (
                <span aria-hidden className="w-11 h-11" />
              )}
              <span className="grow text-center font-work-sans font-medium text-[9px] uppercase tracking-[0.4em] text-arena">
                {estado.paso === 0 || !sede ? 'Reservar cita' : `Reservar · ${sede.name}`}
              </span>
              <Dialog.Close aria-label="Cerrar" className={botonIcono}>
                <X size={18} strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            <Dialog.Title
              ref={titulo}
              tabIndex={-1}
              className="font-coolvetica font-normal text-[32px] leading-none uppercase text-cream outline-none"
            >
              {TITULOS[estado.paso]}
            </Dialog.Title>
            {conPasos && (
              <ol className="grid grid-cols-3 gap-1.5" aria-label="Progreso">
                {PASOS.map((p, i) => (
                  <li key={p} className="flex flex-col gap-1.5" aria-current={i + 1 === estado.paso ? 'step' : undefined}>
                    <span className={cn('block h-[3px]', i + 1 <= estado.paso ? 'bg-cream' : 'bg-[#4a4948]')} />
                    <span className={cn(
                      'font-work-sans text-[9px] uppercase tracking-[0.2em]',
                      i + 1 === estado.paso ? 'font-bold text-cream' : 'text-arena',
                    )}>{p}</span>
                  </li>
                ))}
              </ol>
            )}
          </header>

          {estado.paso === 0 && <StepSede dispatch={dispatch} />}
          {estado.paso === 1 && estado.sedeId && <StepServicio sedeId={estado.sedeId} actual={estado.servicio?.id ?? null} dispatch={dispatch} />}
          {estado.paso === 2 && <StepHueco estado={estado} dispatch={dispatch} />}
          {estado.paso === 3 && <StepDatos estado={estado} dispatch={dispatch} />}
          {estado.paso === 4 && <StepConfirmacion estado={estado} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
