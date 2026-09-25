import { Card, CardContent } from './ui/card'
import { BorderBeam } from './magicui/border-beam'
import { LOCATIONS } from '@/lib/brand'

function BarberCard({ name, index }: { name: string; index: number }) {
  return (
    <Card
      className="group overflow-hidden"
      style={{
        animation: `fade-up 0.6s ease both`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Avatar placeholder */}
      <div className="h-40 sm:h-56 bg-carbon flex items-center justify-center relative overflow-hidden">
        <span className="font-coolvetica font-normal text-6xl text-gray-stone/30 select-none">{name[0]}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-dark2/60 to-transparent" />
      </div>

      <CardContent className="pt-5 pb-6">
        <p className="font-coolvetica font-normal text-base text-cream mb-1">{name}</p>
        <p className="font-work-sans text-[9px] uppercase tracking-[0.3em] text-arena">Barber</p>
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
          <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.45em] text-gray-stone">
            El Equipo
          </span>
        </div>
        <h2 className="font-coolvetica font-normal text-3xl sm:text-4xl uppercase text-cream mb-14 tracking-tight">
          Tu barber
        </h2>

        <div className="flex flex-col gap-14">
          {LOCATIONS.map(l => (
            <div key={l.id}>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="font-coolvetica font-normal text-xl uppercase text-cream">{l.name}</h3>
                {l.isNew && (
                  <span className="px-2 py-1 bg-cream text-carbon font-work-sans font-bold text-[8px] uppercase tracking-[0.3em]">Nueva</span>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {l.barbers.map((name, i) => <BarberCard key={name} name={name} index={i} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
