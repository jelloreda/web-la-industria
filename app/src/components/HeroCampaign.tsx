import { ArrowRight, Star } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { Particles } from './magicui/particles'
import { ShimmerButton } from './magicui/shimmer-button'
import { useBooking } from './booking/BookingProvider'
import { cn } from '@/lib/utils'
import { LOCATIONS } from '@/lib/brand'

// Campaña temporal "dos sedes" (hasta finales de octubre 2026).
// Se activa/desactiva con CAMPAIGN_ACTIVE en lib/brand.ts.
export function HeroCampaign() {
  const { open } = useBooking()

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col bg-carbon overflow-hidden pt-[104px]"
    >
      <Particles quantity={50} color="#7F7F7D" />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #E9E4DB 0px, #E9E4DB 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #E9E4DB 0px, #E9E4DB 1px, transparent 1px, transparent 60px)',
        }}
      />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24 items-center animate-fade-up">
        {/* Copy */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <LogoMark iconSize={240} className="mb-8 max-w-[180px] sm:max-w-none" />

          <div className="flex items-center gap-3 mb-6">
            <span className="block w-0.5 h-4 bg-gray-stone" />
            <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.45em] text-arena">
              Nueva apertura · Madrid
            </span>
            <span className="block w-0.5 h-4 bg-gray-stone lg:hidden" />
          </div>

          <h1 className="font-coolvetica font-normal text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-cream leading-[0.95] mb-6">
            Tu corte,<br />ahora en<br />dos sedes.
          </h1>

          <p className="font-work-sans text-sm leading-relaxed text-arena max-w-[440px] mb-10">
            Abrimos en Argüelles con el mismo oficio y el mismo trato que ya conoces de Guzmán el Bueno. Elige la que te quede más cerca y reserva en su agenda.
          </p>

          <div className="hidden lg:flex items-center gap-8">
            <ShimmerButton onClick={() => open()}>Reservar cita</ShimmerButton>
            <a
              href="#reservas"
              className="font-work-sans font-medium text-[10px] uppercase tracking-[0.35em] text-arena hover:text-cream transition-colors border-b border-arena/30 pb-0.5 hover:border-cream/50"
            >
              Ver sedes
            </a>
          </div>
        </div>

        {/* Sedes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
          {LOCATIONS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => open(l.id)}
              className={cn(
                'text-left w-full',
                'group flex flex-col gap-4 lg:gap-5 p-5 lg:p-9 border transition-colors',
                l.isNew
                  ? 'bg-cream text-carbon border-cream hover:bg-cream-bg'
                  : 'bg-dark2 text-cream border-cream/10 hover:border-cream/40',
              )}
            >
              <span className="flex">
                {l.isNew ? (
                  <span className="px-2.5 py-1.5 bg-carbon text-cream font-work-sans font-bold text-[9px] uppercase tracking-[0.3em]">Nueva</span>
                ) : (
                  <span className="font-work-sans font-bold text-[9px] uppercase tracking-[0.3em] text-arena">Sede</span>
                )}
              </span>
              <span className="font-coolvetica text-2xl lg:text-[40px] leading-none uppercase">{l.name}</span>
              <span
                className={cn(
                  'flex items-center justify-between pt-4 border-t',
                  l.isNew ? 'border-[#ddd8d0]' : 'border-[#4a4948]',
                )}
              >
                <span className={cn('font-work-sans text-xs', l.isNew ? 'text-carbon' : 'text-arena')}>{l.shortAddress}</span>
                <span className="flex items-center gap-2.5 font-work-sans font-bold text-[10px] uppercase tracking-[0.25em]">
                  Reservar
                  <ArrowRight size={16} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-cream/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className="fill-cream text-cream" />
              ))}
            </span>
            <span className="font-coolvetica text-base text-cream">5.0</span>
            <span className="font-work-sans text-[9px] uppercase tracking-[0.2em] text-arena">en Google</span>
          </span>
          <span className="hidden sm:block font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone">
            Cuts and care · Madrid
          </span>
        </div>
      </div>
    </section>
  )
}
