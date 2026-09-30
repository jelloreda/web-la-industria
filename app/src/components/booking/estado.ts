import type { CitaConfirmada, SedeId, ServicioPublico } from '@/lib/booking-api'

export type Paso = 0 | 1 | 2 | 3 | 4

export interface HuecoElegido {
  hora: string
  /** 'any' o id del barber: es lo que se manda al servidor */
  barbero: string
  /** Nombre que se enseña (el primero libre si es 'any') */
  barberoNombre: string
}

export interface EstadoReserva {
  abierto: boolean
  paso: Paso
  sedeId: SedeId | null
  servicio: ServicioPublico | null
  fecha: string
  barbero: string
  barberoNombre: string
  hueco: HuecoElegido | null
  nombre: string
  prefijo: string
  telefono: string
  avisoHuecoOcupado: boolean
  cita: CitaConfirmada | null
}

export const estadoInicial: EstadoReserva = {
  abierto: false, paso: 0, sedeId: null, servicio: null, fecha: '', barbero: 'any', barberoNombre: '',
  hueco: null, nombre: '', prefijo: '+34', telefono: '', avisoHuecoOcupado: false, cita: null,
}

export type Accion =
  | { tipo: 'abrir'; sedeId?: SedeId; hoy: string }
  | { tipo: 'cerrar' }
  | { tipo: 'elegirSede'; sedeId: SedeId }
  | { tipo: 'elegirServicio'; servicio: ServicioPublico }
  | { tipo: 'elegirFecha'; fecha: string }
  | { tipo: 'elegirBarbero'; barbero: string; nombre: string }
  | { tipo: 'elegirHueco'; hueco: HuecoElegido }
  | { tipo: 'continuar' }
  | { tipo: 'volver' }
  | { tipo: 'irA'; paso: 1 | 2 }
  | { tipo: 'dato'; campo: 'nombre' | 'prefijo' | 'telefono'; valor: string }
  | { tipo: 'huecoOcupado' }
  | { tipo: 'confirmada'; cita: CitaConfirmada }

export function reducir(e: EstadoReserva, a: Accion): EstadoReserva {
  switch (a.tipo) {
    case 'abrir':
      return { ...estadoInicial, abierto: true, fecha: a.hoy, sedeId: a.sedeId ?? null, paso: a.sedeId ? 1 : 0 }
    case 'cerrar':
      return estadoInicial
    case 'elegirSede':
      return { ...e, sedeId: a.sedeId, paso: 1, servicio: null, hueco: null, barbero: 'any', barberoNombre: '' }
    case 'elegirServicio':
      return { ...e, servicio: a.servicio, paso: 2, hueco: null, avisoHuecoOcupado: false }
    case 'elegirFecha':
      return { ...e, fecha: a.fecha, hueco: null }
    case 'elegirBarbero':
      return { ...e, barbero: a.barbero, barberoNombre: a.nombre, hueco: null }
    case 'elegirHueco':
      return { ...e, hueco: a.hueco }
    case 'continuar':
      return e.paso === 2 && e.hueco ? { ...e, paso: 3, avisoHuecoOcupado: false } : e
    case 'volver':
      return e.paso >= 1 && e.paso <= 3 ? { ...e, paso: (e.paso - 1) as Paso, avisoHuecoOcupado: false } : e
    case 'irA':
      return { ...e, paso: a.paso, hueco: a.paso === 2 ? null : e.hueco, avisoHuecoOcupado: false }
    case 'dato':
      return { ...e, [a.campo]: a.valor }
    case 'huecoOcupado':
      return { ...e, paso: 2, hueco: null, avisoHuecoOcupado: true }
    case 'confirmada':
      return { ...e, paso: 4, cita: a.cita }
  }
}
