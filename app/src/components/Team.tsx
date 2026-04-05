import { Card, CardContent } from './ui/card'
import { BorderBeam } from './magicui/border-beam'


const barbers = [
  { name: 'Sanmil', role: 'Barber', spec: 'Fade & Classic Cut',  initial: 'S' },
  { name: 'Charlie', role: 'Barber', spec: 'Barba & Styling',    initial: 'C' },
  { name: 'Wuill',  role: 'Barber', spec: 'Degradados & Diseño', initial: 'W' },
]

function BarberCard({ name, role, spec, initial, index }: typeof barbers[0] & { index: number }) {
  return (
    <Card
      className="group overflow-hidden"
      style={{
        animation: `fade-up 0.6s ease both`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Avatar placeholder */}
      <div className="h-56 bg-carbon flex items-center justify-center relative overflow-hidden">
        <span className="font-jost font-black text-6xl text-gray-stone/30 select-none">{initial}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-dark2/60 to-transparent" />
      </div>

      <CardContent className="pt-5 pb-6">
        <p className="font-jost font-black text-base text-cream mb-1">{name}</p>
        <p className="font-jost text-[9px] uppercase tracking-[0.3em] text-arena mb-3">{role}</p>
        <p className="font-jost text-xs text-gray-stone">{spec}</p>
      </CardContent>

      {/* BorderBeam on hover */}
      <BorderBeam className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  )
}

export function Team() {
  return (
    <section id="equipo" className="bg-dark2 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <span className="block w-0.5 h-4 bg-gray-stone" />
          <span className="font-jost font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            02 · El Equipo
          </span>
        </div>
        <h2 className="font-jost font-black text-3xl sm:text-4xl uppercase text-cream mb-14 tracking-tight">
          Tu barber
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {barbers.map((b, i) => <BarberCard key={b.name} {...b} index={i} />)}
        </div>
      </div>
    </section>
  )
}
