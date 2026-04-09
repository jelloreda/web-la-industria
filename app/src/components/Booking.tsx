import { CalendarCheck } from 'lucide-react'
import { ShimmerButton } from './magicui/shimmer-button'
import { BOOKING_URL } from '@/lib/brand'

export function Booking() {
  return (
    <section id="reservas" className="bg-carbon py-28 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="block w-0.5 h-4 bg-gray-stone" />
          <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            Reservas
          </span>
          <span className="block w-0.5 h-4 bg-gray-stone" />
        </div>

        <CalendarCheck className="mx-auto mb-6 text-arena" size={36} strokeWidth={1.2} />

        <h2 className="font-coolvetica font-normal text-4xl sm:text-5xl uppercase text-cream mb-4 tracking-tight leading-none">
          Reserva tu cita
        </h2>

        <p className="font-work-sans font-light text-sm text-gray-stone mb-12 tracking-wide">
          Elige tu barber, tu hora. Sin esperas.
        </p>

        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-testid="cta-reservar">
          <ShimmerButton className="mx-auto">
            Reservar ahora
          </ShimmerButton>
        </a>

        <p className="mt-6 font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone/50">
          Powered by Yeasy
        </p>
      </div>
    </section>
  )
}
