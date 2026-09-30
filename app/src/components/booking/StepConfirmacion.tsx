import * as Dialog from '@radix-ui/react-dialog'
import { Check } from 'lucide-react'
import { LOCATIONS } from '@/lib/brand'
import type { EstadoReserva } from './estado'
import { capitalizar, euros, partesFecha } from './formato'
import { BotonPrincipal, Cuerpo, Pie, Resumen } from './piezas'

export function StepConfirmacion({ estado }: { estado: EstadoReserva }) {
  const cita = estado.cita!
  const sede = LOCATIONS.find(l => l.id === cita.sede)!

  return (
    <>
      <Cuerpo>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 shrink-0 flex items-center justify-center bg-cream text-carbon">
              <Check size={22} strokeWidth={1.8} />
            </span>
            <p className="font-work-sans text-sm leading-relaxed text-cream">
              Te esperamos en {sede.name}. Nos vemos en el sillón.
            </p>
          </div>
          <Resumen filas={[
            ['Servicio', `${cita.servicio} · ${euros(cita.precio, cita.desde)}`],
            ['Día', capitalizar(partesFecha(cita.fecha).largo)],
            ['Hora', `${cita.hora} · ${cita.duracion} min`],
            ['Barber', cita.barbero],
            ['Dirección', sede.shortAddress],
          ]} />
          <p className="font-work-sans text-xs leading-relaxed text-arena">
            ¿Necesitas cambiarla o no puedes venir?{' '}
            <a href={sede.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-cream underline underline-offset-[3px]">Escríbenos por WhatsApp</a>
            {' '}y la movemos.
          </p>
        </div>
      </Cuerpo>
      <Pie>
        <a
          href={sede.mapsUrl} target="_blank" rel="noopener noreferrer"
          className="min-h-12 flex items-center justify-center border border-cream/40 font-work-sans font-bold text-xs uppercase tracking-[0.25em] text-cream hover:border-cream"
        >
          Cómo llegar
        </a>
        <Dialog.Close asChild>
          <BotonPrincipal>Cerrar</BotonPrincipal>
        </Dialog.Close>
      </Pie>
    </>
  )
}
