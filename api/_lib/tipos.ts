export type SedeId = 'guzman-el-bueno' | 'arguelles'
export type Franja = 'manana' | 'tarde' | 'noche'
export type CodigoError = 'DATOS_INVALIDOS' | 'HUECO_OCUPADO' | 'NO_DISPONIBLE' | 'AGENDA_NO_DISPONIBLE'

export interface ServicioPublico { id: string; nombre: string; precio: number; desde: boolean; duracion: number }
export interface BarberoPublico { id: string; nombre: string; foto: string | null }
export interface HuecoPublico { hora: string; franja: Franja; barberos: string[] }

export interface RespuestaServicios { servicios: ServicioPublico[] }
export interface RespuestaHuecos { fecha: string; barberos: BarberoPublico[]; huecos: HuecoPublico[] }

export interface PeticionReserva {
  sede: SedeId
  servicio: string
  fecha: string
  hora: string
  /** 'any' o el id del barber */
  barbero: string
  nombre: string
  prefijo: string
  telefono: string
  /** Campo trampa: los humanos lo dejan vacío */
  website?: string
}

export interface CitaConfirmada {
  sede: SedeId
  servicio: string
  precio: number
  desde: boolean
  fecha: string
  hora: string
  duracion: number
  barbero: string
}

export interface RespuestaError { error: CodigoError; campos?: string[] }
