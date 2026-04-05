import { ChevronDown } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { Particles } from './magicui/particles'
import { Typewriter } from './magicui/typewriter'
import { ShimmerButton } from './magicui/shimmer-button'
import { BOOKING_URL } from '@/lib/brand'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center bg-dark2 overflow-hidden"
    >
      <Particles quantity={70} color="#7F7F7D" />

      {/* Subtle grid texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #E9E4DB 0px, #E9E4DB 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #E9E4DB 0px, #E9E4DB 1px, transparent 1px, transparent 60px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-up">
        <LogoMark iconSize={500} className="mb-8" />

        <p className="font-jost font-light text-[10px] uppercase tracking-[0.6em] text-gray-stone mb-6">
          Madrid · 2025
        </p>

        <h1 className="font-jost font-black text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-cream leading-none mb-6 min-h-[1.2em]">
          <Typewriter
            text="Tu corte, tu estilo."
            speed={60}
            delay={400}
          />
        </h1>

        <p className="font-jost font-light text-base text-gray-stone mb-12 tracking-wide">
          Sin rodeos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <ShimmerButton>Reservar cita</ShimmerButton>
          </a>
          <a
            href="#servicios"
            className="font-jost font-medium text-[10px] uppercase tracking-[0.35em] text-arena hover:text-cream transition-colors border-b border-arena/30 pb-0.5 hover:border-cream/50"
          >
            Ver servicios
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-stone/60 animate-bounce">
        <span className="font-jost text-[8px] uppercase tracking-[0.4em]">Scroll</span>
        <ChevronDown size={14} />
      </div>
    </section>
  )
}
