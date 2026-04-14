import { ChevronDown, Star } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { Particles } from './magicui/particles'
import { Typewriter } from './magicui/typewriter'
import { ShimmerButton } from './magicui/shimmer-button'
import { Marquee } from './magicui/marquee'
import { Card, CardContent } from './ui/card'
import { BOOKING_URL } from '@/lib/brand'

const reviews = [
  { name: 'Álvaro Fernández',      text: 'Primera vez que voy a la peluqueria y encantado con el resultado! Sanmil es un crack y todo un profesional, le dije que queria cambiar de look y me aconsejo un poco. Sin duda repetire!', stars: 5 },
  { name: 'Marcos Guerra Barrios', text: 'Buenos cortes y muy buen trato por Sanmil y sus compañeros!!', stars: 5 },
  { name: 'Jaime García',          text: 'La verdad que el trato ha sido genial, te escuchan, te aconsejan y se nota mucha experiencia. Recomiendo ir totalmente.', stars: 5 },
  { name: 'Diego Lorente Ramos',   text: 'Barbería necesaria por la zona. Novedosa, joven, buen servicio y calidad suprema. En solo una palabra PROFESIONALIDAD!!', stars: 5 },
  { name: 'Eduu_prcl',             text: 'Barbería que recomiendo al 100%. Muy buen ambiente, trato excelente y corte siempre perfecto.', stars: 5 },
  { name: 'Juan Barcelo',          text: 'La mejor barberia!! Samil es majisimo, trata de entender que es lo que quieres. Sin duda alguna volveré.', stars: 5 },
  { name: 'Daniel Castaño Campo',  text: 'Excelente trato, cortes de pelo personalizados con precio justo, Carlos un genio', stars: 5 },
  { name: 'Juan Gutiérrez Castaño', text: 'Me lo he cortado con Carlos, un gran profesional en cuanto a asesoramiento y corte de pelo, muy contento, volveré', stars: 5 },
  { name: 'Victor Canorea',        text: 'Gran descubrimiento, gran profesional Carlos, recomendable 100%', stars: 5 },
]

function ReviewCard({ name, text, stars }: typeof reviews[0]) {
  return (
    <Card className="w-64 shrink-0 p-4">
      <CardContent className="p-0">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={10} className="fill-cream text-cream" />
          ))}
        </div>
        <p className="font-work-sans text-[11px] leading-relaxed text-gray-stone mb-3 line-clamp-2">
          "{text}"
        </p>
        <p className="font-work-sans font-bold text-[9px] uppercase tracking-[0.2em] text-arena">{name}</p>
        <p className="font-work-sans text-[8px] uppercase tracking-[0.2em] text-gray-stone/50 mt-0.5">Google</p>
      </CardContent>
    </Card>
  )
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col bg-dark2 overflow-hidden"
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

      {/* Main content — vertically centered in available space */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-8 animate-fade-up">
        <LogoMark iconSize={400} className="mb-6" />

        <p className="font-work-sans font-light text-[10px] uppercase tracking-[0.6em] text-gray-stone mb-5">
          Madrid · 2025
        </p>

        <h1 className="font-coolvetica font-normal text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-cream leading-none mb-8 min-h-[1.2em]">
          <Typewriter
            text="Tu corte, tu estilo."
            speed={60}
            delay={400}
          />
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <ShimmerButton>Reservar cita</ShimmerButton>
          </a>
          <a
            href="#servicios"
            className="font-work-sans font-medium text-[10px] uppercase tracking-[0.35em] text-arena hover:text-cream transition-colors border-b border-arena/30 pb-0.5 hover:border-cream/50"
          >
            Ver servicios
          </a>
        </div>
      </div>

      {/* Reviews strip — anchored to bottom, above scroll indicator */}
      <div className="relative z-10 w-full overflow-hidden pb-20">
        <div className="flex items-center gap-3 justify-center mb-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className="fill-cream text-cream" />
            ))}
          </div>
          <span className="font-coolvetica font-normal text-base text-cream">5.0</span>
          <span className="font-work-sans text-[9px] uppercase tracking-[0.2em] text-gray-stone">en Google</span>
        </div>
        <Marquee duration={40}>
          {reviews.map(r => <ReviewCard key={r.name} {...r} />)}
        </Marquee>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-stone/60 animate-bounce">
        <span className="font-work-sans text-[8px] uppercase tracking-[0.4em]">Scroll</span>
        <ChevronDown size={14} />
      </div>
    </section>
  )
}
