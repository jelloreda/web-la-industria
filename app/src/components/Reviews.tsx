import { Star } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Marquee } from './magicui/marquee'

const reviews = [
  { name: 'Adrián M.',  text: 'El mejor corte que me han hecho en años. Carlos sabe exactamente lo que quieres aunque no lo sepas explicar.',  stars: 5 },
  { name: 'Pablo R.',   text: 'Ambiente increíble, trato profesional y el resultado habla por sí solo. Ya no voy a ningún otro sitio.',          stars: 5 },
  { name: 'Miguel Á.',  text: 'Vine de recomendación y entiendo por qué todo el mundo habla de este sitio. Limpio, rápido y muy bien.',          stars: 5 },
  { name: 'Rubén T.',   text: 'El degradado que me hace Javi es brutal. Llevo meses viniendo y siempre igual de bien.',                          stars: 5 },
  { name: 'David S.',   text: 'Buen precio, muy buen corte. Sin rodeos, como ellos mismos dicen.',                                              stars: 5 },
  { name: 'Iñaki F.',   text: 'La barba me la dejaron perfecta. El afeitado con navaja es una experiencia aparte. Muy recomendable.',            stars: 5 },
  { name: 'Carlos B.',  text: 'Me cuesta encontrar un barbero que entienda mi tipo de pelo. Aquí me escucharon desde el primer día.',            stars: 5 },
  { name: 'Jorge P.',   text: 'Sitio con personalidad. No es una cadena cualquiera, se nota que hay cuidado en todo. Volveré sin duda.',         stars: 5 },
]

function ReviewCard({ name, text, stars }: typeof reviews[0]) {
  return (
    <Card className="w-72 shrink-0 p-5">
      <CardContent className="p-0">
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={12} className="fill-cream text-cream" />
          ))}
        </div>
        <p className="font-jost text-xs leading-relaxed text-gray-stone mb-4 line-clamp-3">
          "{text}"
        </p>
        <p className="font-jost font-bold text-[10px] uppercase tracking-[0.2em] text-arena">{name}</p>
        <p className="font-jost text-[8px] uppercase tracking-[0.2em] text-gray-stone/50 mt-0.5">Google</p>
      </CardContent>
    </Card>
  )
}

export function Reviews() {
  return (
    <section id="resenas" className="bg-dark2 py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="block w-0.5 h-4 bg-gray-stone" />
          <span className="font-jost font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            05 · Reseñas
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <h2 className="font-jost font-black text-3xl sm:text-4xl uppercase text-cream tracking-tight">
            Lo que dicen
          </h2>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-cream text-cream" />
              ))}
            </div>
            <span className="font-jost font-black text-xl text-cream">5.0</span>
            <span className="font-jost text-[9px] uppercase tracking-[0.2em] text-gray-stone ml-1">
              en Google
            </span>
          </div>
        </div>
      </div>

      <Marquee duration={40}>
        {reviews.map(r => <ReviewCard key={r.name} {...r} />)}
      </Marquee>
    </section>
  )
}
