import { Star } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Marquee } from './magicui/marquee'

const reviews = [
  { name: 'Álvaro Fernández',      text: 'Primera vez que voy a la peluqueria y encantado con el resultado! Fui para probar porque no la conocia y desde el minuto 0 el trato ha sido increible. Sanmil es un crack y todo un profesional, le dije que queria cambiar de look y me aconsejo un poco. La verdad que no puedo estar mas contento con el resultado, sin duda repetire!', stars: 5 },
  { name: 'Marcos Guerra Barrios', text: 'Buenos cortes y muy buen trato por Sanmil y sus compañeros!!', stars: 5 },
  { name: 'Jaime García',          text: 'Me dejé caer por la barbería ya que a la otra a la que voy me pilla más lejos. La verdad que el trato ha sido genial, te escuchan, te aconsejan y se nota mucha experiencia. Me dejaron genial y me aconsejaron bastantes cosillas para mi pelo. La verdad que si pasas o no por allí, recomiendo ir totalmente.', stars: 5 },
  { name: 'Diego Lorente Ramos',   text: 'Barbería necesaria por la zona. Novedosa, joven, buen servicio y calidad suprema. 2 veces he estado y a parte de ir todo rodado el corte fue increíble. En solo una palabra PROFESIONALIDAD!!', stars: 5 },
  { name: 'Eduu_prcl',             text: 'Barbería que recomiendo al 100%. Muy buen ambiente, trato excelente y corte siempre perfecto. Personalmente me corto el pelo con Sanmil y estoy encantado!', stars: 5 },
  { name: 'Juan Barcelo',          text: 'La mejor barberia!! Es la primera vez que tengo una experiencia tan buena. Samil es majisimo, trata de entender que es lo que quieres y adaptarlo para que quede lo mejor posible. Sin duda alguna volveré.', stars: 5 },
  { name: 'Daniel Castaño Campo',  text: 'Excelente trato, cortes de pelo personalizados con precio justo, Carlos un genio', stars: 5 },
  { name: 'Juan Gutiérrez Castaño', text: 'Me lo he cortado con Carlos, un gran profesional en cuanto a asesoramiento y corte de pelo, muy contento, volveré', stars: 5 },
  { name: 'Victor Canorea',        text: 'Gran descubrimiento, gran profesional Carlos, recomendable 100%', stars: 5 },
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
            Reseñas
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
