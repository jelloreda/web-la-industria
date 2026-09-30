import type { CodigoError } from './tipos'

export class ErrorReserva extends Error {
  constructor(public codigo: CodigoError, public status: number, public campos?: string[]) {
    super(codigo)
  }
}
