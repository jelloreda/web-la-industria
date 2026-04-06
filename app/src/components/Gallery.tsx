import photo01 from '@/assets/01.jpg'
import photo02 from '@/assets/02.jpg'
import photo03 from '@/assets/03.jpg'
import { cn } from '@/lib/utils'

const photos = [
  { src: photo01, alt: 'La Industria Barbería — vista principal' },
  { src: photo02, alt: 'La Industria Barbería — zona de sillones' },
  { src: photo03, alt: 'La Industria Barbería — espacio completo' },
]

function GalleryPhoto({ src, alt, index }: { src: string; alt: string; index: number }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        index === 0 ? 'sm:col-span-2 sm:row-span-2' : '',
      )}
      style={{
        animation: `fade-up 0.6s ease both`,
        animationDelay: `${index * 120}ms`,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover aspect-video group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/50 transition-colors duration-500 flex items-center justify-center">
        <span className="font-jost font-light text-[9px] uppercase tracking-[0.5em] text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          La Industria · Madrid
        </span>
      </div>
    </div>
  )
}

export function Gallery() {
  return (
    <section id="galeria" className="bg-carbon py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <span className="block w-0.5 h-4 bg-gray-stone" />
          <span className="font-jost font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            El Espacio
          </span>
        </div>
        <h2 className="font-jost font-black text-3xl sm:text-4xl uppercase text-cream mb-14 tracking-tight">
          Donde sucede
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-3 sm:h-[520px]">
          {photos.map((p, i) => <GalleryPhoto key={p.alt} {...p} index={i} />)}
        </div>
      </div>
    </section>
  )
}
