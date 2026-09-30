import { useState } from 'react'
import { api, ErrorApi } from '@/lib/booking-api'
import { LOCATIONS } from '@/lib/brand'
import { nombreValido, PREFIJOS, telefonoValido } from '@/lib/booking-validation'
import { cn } from '@/lib/utils'
import type { Accion, EstadoReserva } from './estado'
import { capitalizar, euros, partesFecha } from './formato'
import { AvisoError, BotonPrincipal, Cuerpo, Pie, Resumen, TEXTO_ERROR_RESERVA } from './piezas'
import { limpiarCache } from './useCarga'

const campo = 'h-12 px-3.5 bg-dark2 border font-work-sans text-[15px] text-cream placeholder:text-gray-stone'

export function StepDatos({ estado, dispatch }: { estado: EstadoReserva; dispatch: (a: Accion) => void }) {
  const sede = LOCATIONS.find(l => l.id === estado.sedeId)!
  const servicio = estado.servicio!
  const hueco = estado.hueco!
  const [intentado, setIntentado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(false)
  const [rechazados, setRechazados] = useState<string[]>([])
  const [trampa, setTrampa] = useState('')

  const malNombre = (intentado && !nombreValido(estado.nombre)) || rechazados.includes('nombre')
  const malTelefono = (intentado && !telefonoValido(estado.prefijo, estado.telefono)) || rechazados.includes('telefono')

  const cambiar = (c: 'nombre' | 'prefijo' | 'telefono', valor: string) => {
    setRechazados([])
    dispatch({ tipo: 'dato', campo: c, valor })
  }

  const enviar = async () => {
    setIntentado(true)
    setErrorGeneral(false)
    if (!nombreValido(estado.nombre) || !telefonoValido(estado.prefijo, estado.telefono)) return
    setEnviando(true)
    try {
      const { cita } = await api.reservar({
        sede: sede.id, servicio: servicio.id, fecha: estado.fecha, hora: hueco.hora, barbero: hueco.barbero,
        nombre: estado.nombre, prefijo: estado.prefijo, telefono: estado.telefono, website: trampa,
      })
      dispatch({ tipo: 'confirmada', cita })
    } catch (e) {
      const err = e instanceof ErrorApi ? e : new ErrorApi('AGENDA_NO_DISPONIBLE')
      if (err.codigo === 'HUECO_OCUPADO') {
        limpiarCache()
        dispatch({ tipo: 'huecoOcupado' })
      } else if (err.codigo === 'DATOS_INVALIDOS' && err.campos.some(c => c === 'nombre' || c === 'telefono')) {
        setRechazados(err.campos)
      } else {
        setErrorGeneral(true)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="grow min-h-0 flex flex-col" noValidate onSubmit={e => { e.preventDefault(); void enviar() }}>
      <Cuerpo>
        <div className="flex flex-col gap-6">
          {errorGeneral && <AvisoError texto={TEXTO_ERROR_RESERVA} whatsappUrl={sede.whatsappUrl} />}

          <Resumen filas={[
            ['Servicio', `${servicio.nombre} · ${euros(servicio.precio, servicio.desde)}`],
            ['Día', capitalizar(partesFecha(estado.fecha).largo)],
            ['Hora', `${hueco.hora} · ${servicio.duracion} min`],
            ['Barber', hueco.barberoNombre],
          ]}>
            <button type="button" onClick={() => dispatch({ tipo: 'irA', paso: 2 })} className="self-end min-h-10 px-4 font-work-sans font-medium text-[10px] uppercase tracking-[0.3em] text-arena hover:text-cream underline underline-offset-4">
              Cambiar
            </button>
          </Resumen>

          <div className="flex flex-col gap-2">
            <label htmlFor="reserva-nombre" className="font-work-sans font-bold text-[9px] uppercase tracking-[0.25em] text-arena">Nombre y apellidos</label>
            <input
              id="reserva-nombre" type="text" autoComplete="name" placeholder="Nombre Apellido"
              value={estado.nombre} onChange={e => cambiar('nombre', e.target.value)}
              aria-invalid={malNombre} aria-describedby={malNombre ? 'reserva-nombre-error' : undefined}
              className={cn(campo, malNombre ? 'border-cream' : 'border-[#4a4948]')}
            />
            {malNombre && <p id="reserva-nombre-error" className="font-work-sans text-[11px] text-cream">Escribe tu nombre y al menos un apellido.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reserva-telefono" className="font-work-sans font-bold text-[9px] uppercase tracking-[0.25em] text-arena">Teléfono</label>
            <div className="flex">
              <select
                aria-label="Prefijo del país" value={estado.prefijo} onChange={e => cambiar('prefijo', e.target.value)}
                className="h-12 px-2 bg-dark2 border border-r-0 border-[#4a4948] rounded-none font-work-sans text-[15px] text-cream"
              >
                {PREFIJOS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
              <input
                id="reserva-telefono" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="600 000 000"
                value={estado.telefono} onChange={e => cambiar('telefono', e.target.value)}
                aria-invalid={malTelefono} aria-describedby={malTelefono ? 'reserva-telefono-error' : undefined}
                className={cn(campo, 'grow min-w-0', malTelefono ? 'border-cream' : 'border-[#4a4948]')}
              />
            </div>
            {malTelefono && (
              <p id="reserva-telefono-error" className="font-work-sans text-[11px] text-cream">
                {estado.prefijo === '+34' ? 'Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9.' : 'Revisa el teléfono: solo cifras, sin el prefijo.'}
              </p>
            )}
          </div>

          <input
            type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
            value={trampa} onChange={e => setTrampa(e.target.value)} className="hidden"
          />

          <p className="font-work-sans text-[11px] leading-relaxed text-arena">
            Si ya has venido antes, usamos tu ficha. Tu teléfono solo sirve para gestionar la cita.
          </p>
        </div>
      </Cuerpo>
      <Pie>
        <BotonPrincipal type="submit" disabled={enviando}>{enviando ? 'Reservando…' : 'Reservar cita'}</BotonPrincipal>
      </Pie>
    </form>
  )
}
