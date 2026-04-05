import { Card, CardHeader, CardContent } from './ui/card'

const services = [
  { name: 'Corte de pelo standard',      price: '16 €', desc: 'Corte clásico o moderno adaptado a tu estilo.' },
  { name: 'Corte de pelo premium',        price: '18 €', desc: 'Corte con acabado y atención al detalle superior.' },
  { name: 'Corte completo a tijera',      price: 'desde 20 €', desc: 'Corte íntegramente a tijera para un resultado natural y preciso.' },
  { name: 'Corte y barba standard',       price: '25 €', desc: 'Corte más arreglo de barba. Combinación completa.' },
  { name: 'Corte y barba premium',        price: '27 €', desc: 'Versión premium del corte y barba, con acabado de detalle.' },
  { name: 'Corte a tijera y barba',       price: 'desde 27 €', desc: 'Corte a tijera con perfilado y definición de barba incluidos.' },
  { name: 'Arreglo de barba premium',     price: '15 €', desc: 'Perfilado, definición y acabado impecable de tu barba.' },
  { name: 'Corte pelo jubilado',          price: '12 €', desc: 'Servicio especial para nuestros clientes jubilados.' },
]

function ServiceCard({ name, price, desc, index }: typeof services[0] & { index: number }) {
  return (
    <Card
      className="group hover:border-cream/30 transition-colors duration-500"
      style={{
        animation: `fade-up 0.6s ease both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-jost font-bold text-sm uppercase tracking-[0.2em] text-cream">
            {name}
          </h3>
          <span
            className="font-jost font-black text-lg text-cream shrink-0"
            style={{
              background: 'linear-gradient(105deg, #E9E4DB 0%, #A4A4A4 50%, #E9E4DB 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}
          >
            {price}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-jost text-xs leading-relaxed text-gray-stone">{desc}</p>
      </CardContent>
    </Card>
  )
}

export function Services() {
  return (
    <section id="servicios" className="bg-carbon py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <span className="block w-0.5 h-4 bg-gray-stone" />
          <span className="font-jost font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            01 · Servicios
          </span>
        </div>
        <h2 className="font-jost font-black text-3xl sm:text-4xl uppercase text-cream mb-14 tracking-tight">
          Lo que hacemos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => <ServiceCard key={s.name} {...s} index={i} />)}
        </div>
      </div>
    </section>
  )
}
