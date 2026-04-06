import { MapPin, Clock, Phone, Instagram as InstagramIcon, ExternalLink } from 'lucide-react'
import { ShimmerButton } from './magicui/shimmer-button'
import { LogoMark } from './LogoMark'
import { INSTAGRAM, IG_URL, MAPS_EMBED, MAPS_URL, PHONE, ADDRESS, HOURS } from '@/lib/brand'

export function Contact() {
  return (
    <>
      <section id="contacto" className="bg-dark2 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="block w-0.5 h-4 bg-gray-stone" />
            <span className="font-jost font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
              Contacto
            </span>
          </div>
          <h2 className="font-jost font-black text-3xl sm:text-4xl uppercase text-cream mb-14 tracking-tight">
            Encuéntranos
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-jost font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Ubicación</p>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-jost text-sm text-cream hover:text-arena transition-colors flex items-center gap-2"
                  >
                    {ADDRESS}
                    <ExternalLink size={11} className="text-gray-stone" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-jost font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-2">Horario</p>
                  <div className="space-y-1">
                    {HOURS.map(h => (
                      <div key={h.days} className="flex gap-6">
                        <span className="font-jost text-xs text-gray-stone w-36">{h.days}</span>
                        <span className="font-jost text-xs text-cream">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-jost font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Teléfono</p>
                  <a
                    href={`tel:${PHONE.replace(/\s/g, '')}`}
                    className="font-jost text-sm text-cream hover:text-arena transition-colors"
                  >
                    {PHONE}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <InstagramIcon size={16} className="text-arena mt-0.5 shrink-0" />
                <div>
                  <p className="font-jost font-bold text-[10px] uppercase tracking-[0.3em] text-arena mb-1">Instagram</p>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-jost text-sm text-cream hover:text-arena transition-colors"
                  >
                    {INSTAGRAM}
                  </a>
                </div>
              </div>

              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="block mt-6">
                <ShimmerButton>Cómo llegar</ShimmerButton>
              </a>
            </div>

            {/* Map */}
            <div className="h-80 lg:h-auto min-h-64 bg-carbon overflow-hidden border border-white/5">
              <iframe
                title="La Industria Barbería en Google Maps"
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.6) contrast(1.1) brightness(0.8)' }}
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
          <p className="font-jost text-[8px] uppercase tracking-[0.3em] text-gray-stone/50 text-center">
            © 2025 La Industria · Todos los derechos reservados
          </p>
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-jost text-[9px] uppercase tracking-[0.3em] text-gray-stone hover:text-cream transition-colors"
          >
            {INSTAGRAM}
          </a>
        </div>
      </footer>
    </>
  )
}
