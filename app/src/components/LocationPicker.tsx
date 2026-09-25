import { createContext, useContext, useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowRight, X } from 'lucide-react'
import { LOCATIONS } from '@/lib/brand'

const LocationPickerContext = createContext<() => void>(() => {})

/** Returns a function that opens the "Elige tu sede" dialog. */
export function useLocationPicker() {
  return useContext(LocationPickerContext)
}

export function LocationPickerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <LocationPickerContext.Provider value={() => setOpen(true)}>
      {children}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
          <DialogPrimitive.Content
            data-testid="location-picker"
            className="fixed z-50 inset-x-0 bottom-0 bg-carbon border-t border-white/10 px-5 pt-3 pb-8 flex flex-col gap-5 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[640px] sm:max-w-[calc(100vw-2rem)] sm:border sm:p-10 sm:gap-7"
          >
            <span aria-hidden className="self-center block w-10 h-[3px] bg-gray-stone sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="hidden sm:flex items-center gap-3 mb-3">
                  <span className="block w-0.5 h-4 bg-gray-stone" />
                  <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.45em] text-arena">
                    Reservar cita
                  </span>
                </div>
                <DialogPrimitive.Title className="font-coolvetica font-normal text-3xl sm:text-4xl uppercase text-cream leading-none">
                  Elige tu sede
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close
                aria-label="Cerrar"
                className="w-11 h-11 shrink-0 flex items-center justify-center text-arena hover:text-cream sm:border sm:border-cream/10 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </DialogPrimitive.Close>
            </div>

            <DialogPrimitive.Description className="hidden sm:block max-w-[460px] font-work-sans text-[13px] leading-relaxed text-arena">
              Cada sede lleva su propia agenda, así que elige dónde quieres cortarte y te llevamos directo a su reserva.
            </DialogPrimitive.Description>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              {LOCATIONS.map(l => (
                <a
                  key={l.id}
                  href={l.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  data-testid={`picker-${l.id}`}
                  className="group flex items-center gap-4 sm:gap-6 px-4 py-5 sm:p-6 bg-dark2 border border-cream/10 hover:border-cream/40 transition-colors"
                >
                  <span className="flex flex-col gap-1.5 grow">
                    <span className="flex items-center gap-3">
                      <span className="font-coolvetica text-lg sm:text-[22px] leading-none uppercase text-cream">{l.name}</span>
                      {l.isNew && (
                        <span className="px-2 py-1 bg-cream text-carbon font-work-sans font-bold text-[8px] uppercase tracking-[0.3em]">Nueva</span>
                      )}
                    </span>
                    <span className="font-work-sans text-[11px] sm:text-xs text-arena">{l.shortAddress}</span>
                  </span>
                  <span className="flex items-center gap-2.5 font-work-sans font-bold text-[10px] uppercase tracking-[0.25em] text-cream">
                    <span className="hidden sm:inline">Reservar</span>
                    <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              ))}
            </div>

            <p className="text-center font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone">
              Powered by Yeasy
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </LocationPickerContext.Provider>
  )
}
