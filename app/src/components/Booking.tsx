import { useRef, useState } from 'react'
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react'
import guzman01 from '@/assets/guzman-01.webp'
import guzman02 from '@/assets/guzman-02.webp'
import arguelles01 from '@/assets/arguelles-01.webp'
import arguelles02 from '@/assets/arguelles-02.webp'
import { cn } from '@/lib/utils'
import { LOCATIONS, joinNames, type Location } from '@/lib/brand'

const photos: Record<string, string[]> = {
  'guzman-el-bueno': [guzman01, guzman02],
  arguelles: [arguelles01, arguelles02],
}

function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const goTo = (i: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="group relative h-40 sm:h-60" aria-roledescription="carrusel" aria-label={`Fotos de ${name}`}>
      <div
        ref={track}
        onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {photos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Interior de la sede de ${name}, foto ${i + 1} de ${photos.length}`}
            className="w-full h-full shrink-0 snap-center object-cover"
            style={{ filter: 'grayscale(0.5) contrast(1.05)' }}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>

      {index > 0 && (
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => goTo(index - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-dark2/80 text-cream hover:bg-dark2 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => goTo(index + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-dark2/80 text-cream hover:bg-dark2 transition-colors"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((src, i) => (
          <span
            key={src}
            aria-hidden
            className={cn('block h-[3px] transition-all', i === index ? 'w-6 bg-cream' : 'w-3 bg-cream/40')}
          />
        ))}
      </div>
    </div>
  )
}

function LocationCard({ location: l }: { location: Location }) {
  return (
    <article className="bg-dark2 border border-cream/5 flex flex-col">
      <div className="relative">
        <PhotoCarousel photos={photos[l.id]} name={l.name} />
        {l.isNew && (
          <span className="absolute right-4 top-4 px-2.5 py-1.5 bg-cream text-carbon font-work-sans font-bold text-[9px] uppercase tracking-[0.3em]">
            Nueva
          </span>
        )}
      </div>

      <div className="p-6 sm:p-8 flex flex-col gap-6 grow text-left">
        <div className="flex flex-col gap-2">
          <span className="font-work-sans font-bold text-[9px] uppercase tracking-[0.3em] text-arena">
            Sede{l.isNew && ' · Nueva apertura'}
          </span>
          <h3 className="font-coolvetica font-normal text-3xl uppercase leading-none text-cream">{l.name}</h3>
        </div>

        <div className="flex flex-col gap-4 pt-5 border-t border-[#4a4948]">
          <div className="flex gap-3 items-start">
            <MapPin size={16} strokeWidth={1.5} className="text-arena shrink-0 mt-px" />
            <span className="font-work-sans text-[13px] text-cream">{l.address}</span>
          </div>
          <div className="flex gap-3 items-start">
            <Clock size={16} strokeWidth={1.5} className="text-arena shrink-0 mt-px" />
            <div className="grid grid-cols-[128px_auto] gap-y-1 font-work-sans text-xs">
              {l.hours.map(h => (
                <div key={h.days} className="contents">
                  <span className="text-arena">{h.days}</span>
                  <span className="text-cream">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Users size={16} strokeWidth={1.5} className="text-arena shrink-0 mt-px" />
            <span className="font-work-sans text-xs text-arena">
              Barbers · <span className="text-cream">{joinNames(l.barbers)}</span>
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3.5 items-stretch">
          <a
            href={l.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`cta-reservar-${l.id}`}
            className="block text-center px-6 py-4 bg-cream text-carbon hover:bg-cream-bg font-work-sans font-bold text-[13px] uppercase tracking-[0.25em] transition-colors"
          >
            Reservar aquí
          </a>
          <a
            href={l.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-center py-2 font-work-sans font-medium text-[10px] uppercase tracking-[0.35em] text-arena hover:text-cream border-b border-arena/30 hover:border-cream/50 transition-colors"
          >
            Cómo llegar
          </a>
        </div>
      </div>
    </article>
  )
}

export function Booking() {
  return (
    <section id="reservas" className="bg-carbon py-28 px-5 sm:px-6">
      <div className="max-w-5xl mx-auto text-center">
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

        <p className="font-work-sans font-light text-sm text-gray-stone mb-12 sm:mb-14 tracking-wide">
          Elige tu sede, tu barber y tu hora. Sin esperas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOCATIONS.map(l => <LocationCard key={l.id} location={l} />)}
        </div>

        <p className="mt-8 font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone">
          Cada sede tiene su propia agenda · Powered by Yeasy
        </p>
      </div>
    </section>
  )
}
