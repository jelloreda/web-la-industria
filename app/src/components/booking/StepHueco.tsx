import { useMemo } from 'react'
import { MessageCircle, Users } from 'lucide-react'
import { api, type HuecoPublico, type RespuestaHuecos } from '@/lib/booking-api'
import { LOCATIONS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { rangoReservable } from '../../../../api/_lib/fecha'
import type { Accion, EstadoReserva } from './estado'
import { capitalizar, euros, partesFecha } from './formato'
import { AvisoError, BotonPrincipal, Cuerpo, Esqueleto, Etiqueta, Pie, TEXTO_ERROR_CARGA } from './piezas'
import { useCarga } from './useCarga'

const FRANJAS = [['manana', 'Mañana'], ['tarde', 'Tarde'], ['noche', 'Noche']] as const

export function StepHueco({ estado, dispatch }: { estado: EstadoReserva; dispatch: (a: Accion) => void }) {
  const sede = LOCATIONS.find(l => l.id === estado.sedeId)!
  const servicio = estado.servicio!
  const dias = useMemo(() => rangoReservable(new Date()), [])
  const dia = partesFecha(estado.fecha)

  const [carga, reintentar] = useCarga<RespuestaHuecos>(
    `huecos:${sede.id}:${servicio.id}:${estado.fecha}`,
    () => dia.domingo
      ? Promise.resolve({ fecha: estado.fecha, barberos: [], huecos: [] })
      : api.huecos(sede.id, servicio.id, estado.fecha),
  )
  const datos = carga.tipo === 'ok' ? carga.datos : null

  const barberoDisponible = estado.barbero === 'any' || !datos || datos.barberos.some(b => b.id === estado.barbero)
  const efectivo = barberoDisponible ? estado.barbero : 'any'
  const nombreDe = (id: string) => datos?.barberos.find(b => b.id === id)?.nombre ?? ''
  const huecos = (datos?.huecos ?? []).filter(h => efectivo === 'any' || h.barberos.includes(efectivo))
  const siguiente = dias.slice(dias.indexOf(estado.fecha) + 1).find(d => !partesFecha(d).domingo)

  const elegirHueco = (h: HuecoPublico) => {
    const quien = efectivo === 'any' ? h.barberos[0] : efectivo
    dispatch({ tipo: 'elegirHueco', hueco: { hora: h.hora, barbero: efectivo, barberoNombre: nombreDe(quien) } })
  }

  const nota = estado.hueco
    ? `${partesFecha(estado.fecha).corto} · ${estado.hueco.hora} · con ${estado.hueco.barberoNombre}`
    : 'Elige una hora para continuar'

  return (
    <>
      <Cuerpo>
        <div className="flex flex-col gap-6">
          {estado.avisoHuecoOcupado && (
            <div role="alert" className="flex gap-3 px-4 py-3.5 border border-cream">
              <span aria-hidden className="block w-[3px] self-stretch bg-cream" />
              <span className="flex flex-col gap-1">
                <span className="font-work-sans font-bold text-[13px] text-cream">Esa hora ya no está disponible</span>
                <span className="font-work-sans text-xs leading-relaxed text-arena">
                  Alguien la ha reservado mientras completabas tus datos. Hemos actualizado los huecos: elige otra y la guardamos con tus datos.
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 px-3.5 py-3 bg-dark2">
            <span aria-hidden className="block w-[3px] self-stretch bg-cream" />
            <span className="grow min-w-0 flex flex-col gap-0.5">
              <span className="font-work-sans font-medium text-[13px] text-cream">{servicio.nombre}</span>
              <span className="font-work-sans text-[11px] text-arena">{servicio.duracion} min · {euros(servicio.precio, servicio.desde)}</span>
            </span>
            <button type="button" onClick={() => dispatch({ tipo: 'irA', paso: 1 })} className="min-h-11 px-1 font-work-sans font-medium text-[10px] uppercase tracking-[0.3em] text-arena hover:text-cream underline underline-offset-4">
              Cambiar
            </button>
          </div>

          <section className="flex flex-col gap-2.5" aria-label="Día">
            <Etiqueta>Próximos 7 días</Etiqueta>
            <div className="grid grid-cols-7 gap-1">
              {dias.map(f => {
                const p = partesFecha(f)
                const sel = f === estado.fecha
                return (
                  <button
                    key={f}
                    type="button"
                    disabled={p.domingo}
                    aria-pressed={sel}
                    aria-label={p.domingo ? `${capitalizar(p.largo)}, cerrado` : capitalizar(p.largo)}
                    onClick={() => dispatch({ tipo: 'elegirFecha', fecha: f })}
                    className={cn(
                      'h-[60px] flex flex-col items-center justify-center gap-1.5 border transition-colors',
                      sel ? 'bg-cream border-cream text-carbon' : 'border-cream/10 text-cream hover:border-cream/40',
                      p.domingo && 'opacity-50 text-gray-stone cursor-not-allowed hover:border-cream/10',
                    )}
                  >
                    <span className="font-work-sans text-[9px] uppercase tracking-[0.15em]">{p.dow}</span>
                    <span className="font-coolvetica text-xl leading-none">{p.num}</span>
                  </button>
                )
              })}
            </div>
            <a href={sede.whatsappUrl} target="_blank" rel="noopener noreferrer" className="self-start min-h-8 flex items-center gap-2 font-work-sans text-[11px] text-arena">
              <MessageCircle size={14} strokeWidth={1.5} />
              <span>¿Más adelante? <span className="text-cream underline underline-offset-[3px]">Escríbenos por WhatsApp</span></span>
            </a>
          </section>

          <section className="flex flex-col gap-2.5" aria-label="Barber">
            <Etiqueta>Barber</Etiqueta>
            <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {[{ id: 'any', nombre: 'Cualquiera', foto: null as string | null }, ...(datos?.barberos ?? [])].map(b => {
                const sel = b.id === efectivo
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => dispatch({ tipo: 'elegirBarbero', barbero: b.id, nombre: b.nombre })}
                    className={cn(
                      'shrink-0 w-[78px] flex flex-col items-center gap-2 px-1 py-2.5 border transition-colors',
                      sel ? 'border-cream text-cream' : 'border-cream/10 text-arena hover:border-cream/40',
                    )}
                  >
                    <span className={cn(
                      'w-12 h-12 overflow-hidden flex items-center justify-center border-2',
                      sel ? 'border-cream' : 'border-transparent',
                      b.id === 'any' && sel ? 'bg-cream text-carbon' : 'bg-dark2 text-cream',
                    )}>
                      {b.id === 'any'
                        ? <Users size={22} strokeWidth={1.5} />
                        : b.foto
                          ? <img src={b.foto} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(1) contrast(1.05)' }} />
                          : <span className="font-coolvetica text-xl">{b.nombre.charAt(0)}</span>}
                    </span>
                    <span className="font-work-sans font-medium text-[11px]">{b.nombre}</span>
                  </button>
                )
              })}
            </div>
            {!barberoDisponible && (
              <p className="font-work-sans text-[11px] leading-relaxed text-arena">
                {estado.barberoNombre} no trabaja el {dia.diaSemana}. Te enseñamos los huecos de todo el equipo.
              </p>
            )}
          </section>

          {carga.tipo === 'cargando' && (
            <div aria-label="Cargando huecos" className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => <Esqueleto key={i} className="h-11" />)}
            </div>
          )}

          {carga.tipo === 'error' && <AvisoError texto={TEXTO_ERROR_CARGA} onReintentar={reintentar} whatsappUrl={sede.whatsappUrl} />}

          {datos && huecos.length === 0 && (
            <div className="flex flex-col gap-3.5 px-4 py-5 bg-dark2">
              <span className="font-coolvetica text-xl leading-tight uppercase text-cream">
                {dia.domingo ? 'Los domingos cerramos' : 'No quedan huecos este día'}
              </span>
              <span className="font-work-sans text-[13px] leading-relaxed text-arena">
                {dia.domingo
                  ? 'Elige otro día de la semana.'
                  : `No hay horas libres con ${efectivo === 'any' ? 'ningún barber' : nombreDe(efectivo)} el ${dia.largo}. Prueba otro día u otro barber.`}
              </span>
              {siguiente && (
                <button
                  type="button"
                  onClick={() => dispatch({ tipo: 'elegirFecha', fecha: siguiente })}
                  className="self-start min-h-11 px-4 border border-cream/40 font-work-sans font-bold text-[11px] uppercase tracking-[0.25em] text-cream"
                >
                  Ver el {partesFecha(siguiente).diaSemana} {partesFecha(siguiente).num}
                </button>
              )}
            </div>
          )}

          {huecos.length > 0 && FRANJAS.map(([franja, titulo]) => {
            const lista = huecos.filter(h => h.franja === franja)
            if (!lista.length) return null
            return (
              <section key={franja} className="flex flex-col gap-2.5" aria-label={titulo}>
                <Etiqueta>{titulo}</Etiqueta>
                <div className="grid grid-cols-4 gap-1.5">
                  {lista.map(h => {
                    const sel = estado.hueco?.hora === h.hora
                    return (
                      <button
                        key={h.hora}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => elegirHueco(h)}
                        className={cn(
                          'h-11 border font-work-sans text-[13px] transition-colors',
                          sel ? 'bg-cream border-cream text-carbon font-bold' : 'border-cream/15 text-cream hover:border-cream/50',
                        )}
                      >
                        {h.hora}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </Cuerpo>
      <Pie nota={nota}>
        <BotonPrincipal disabled={!estado.hueco} onClick={() => dispatch({ tipo: 'continuar' })}>Continuar</BotonPrincipal>
      </Pie>
    </>
  )
}
