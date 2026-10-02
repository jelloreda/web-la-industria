import { useState } from 'react'
import { MapPin, Clock, Phone, Instagram as InstagramIcon, MessageCircle, ExternalLink } from 'lucide-react'
import { ShimmerButton } from './magicui/shimmer-button'
import { useBooking } from './booking/BookingProvider'
import { LogoMark } from './LogoMark'
import { cn } from '@/lib/utils'
import { INSTAGRAM, IG_URL, LOCATIONS } from '@/lib/brand'

export function Contact() {
  const { open } = useBooking()
  const [active, setActive] = useState(0)
  const loc = LOCATIONS[active]

  return (
    <>
      <section id="contacto" className="bg-dark2 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="block w-0.5 h-4 bg-gray-stone" />
            <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
              Contacto
            </span>
          </div>
          <h2 className="font-coolvetica font-normal text-3xl sm:text-4xl uppercase text-cream mb-10 tracking-tight">
            Encuéntranos
          </h2>

          <div role="tablist" aria-label="Sedes" className="flex gap-6 sm:gap-8 border-b border-cream/10 mb-12">
            {LOCATIONS.map((l, i) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                id={`tab-${l.id}`}
                aria-selected={i === active}
                aria-controls="panel-sede"
                onClick={() => setActive(i)}
                className={cn(
                  'py-4 -mb-px border-b-2 transition-colors',
                  i === active ? 'border-cream text-cream' : 'border-transparent text-gray-stone hover:text-arena',
                )}
              >
                <span className="font-coolvetica text-lg sm:text-[22px] uppercase leading-none">{l.name}</span>
              </button>
            ))}
          </div>

          <div role="tabpanel" id="panel-sede" aria-labelledby={`tab-${loc.id}`} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-work-sans font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Ubicación</p>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-work-sans text-sm text-cream hover:text-arena transition-colors flex items-center gap-2"
                  >
                    {loc.address}
                    <ExternalLink size={11} className="text-gray-stone" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-work-sans font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-2">Horario</p>
                  <div className="space-y-1">
                    {loc.hours.map(h => (
                      <div key={h.days} className="flex gap-6">
                        <span className="font-work-sans text-xs text-gray-stone w-36">{h.days}</span>
                        <span className="font-work-sans text-xs text-cream">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-work-sans font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Teléfono</p>
                  <a
                    href={`tel:${loc.phone.replace(/\s/g, '')}`}
                    className="font-work-sans text-sm text-cream hover:text-arena transition-colors"
                  >
                    {loc.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MessageCircle size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-work-sans font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">WhatsApp</p>
                  <a
                    href={loc.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-work-sans text-sm text-cream hover:text-arena transition-colors"
                  >
                    {loc.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <InstagramIcon size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-work-sans font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Instagram</p>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-work-sans text-sm text-cream hover:text-arena transition-colors"
                  >
                    {INSTAGRAM}
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-6">
                <ShimmerButton onClick={() => open(loc.id)}>Reservar aquí</ShimmerButton>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-work-sans font-medium text-[10px] uppercase tracking-[0.35em] text-arena hover:text-cream transition-colors border-b border-arena/30 pb-0.5 hover:border-cream/50"
                >
                  Cómo llegar
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="h-80 lg:h-auto min-h-64 bg-carbon overflow-hidden border border-white/5">
              <iframe
                key={loc.id}
                title={`La Industria ${loc.name} en Google Maps`}
                src={loc.mapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.4) contrast(1.0) brightness(1.1)' }}
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-carbon border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <LogoMark showText={false} iconSize={40} />
          <div className="flex flex-col items-center gap-3">
            <p className="font-work-sans text-[8px] uppercase tracking-[0.3em] text-gray-stone/50 text-center">
              © {new Date().getFullYear()} La Industria · Todos los derechos reservados
            </p>
            <nav aria-label="Información legal" className="flex gap-6 font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone">
              <a href="/aviso-legal.html" className="hover:text-cream transition-colors">Aviso legal</a>
              <a href="/privacidad.html" className="hover:text-cream transition-colors">Privacidad</a>
            </nav>
          </div>
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-work-sans text-[9px] uppercase tracking-[0.3em] text-gray-stone hover:text-cream transition-colors"
          >
            {INSTAGRAM}
          </a>
        </div>
      </footer>
    </>
  )
}
