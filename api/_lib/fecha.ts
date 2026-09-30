const TZ = 'Europe/Madrid'
export const DIAS_RESERVABLES = 7

export function fechaMadrid(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function rangoReservable(ahora: Date): string[] {
  const hoy = fechaMadrid(ahora)
  return Array.from({ length: DIAS_RESERVABLES }, (_, i) => sumarDias(hoy, i))
}

export function esFechaReservable(fecha: string, ahora: Date): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && rangoReservable(ahora).includes(fecha)
}

export function semanaIso(fecha: string): { week: number; year: number } {
  const [y, m, d] = fecha.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  const diaSemana = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - diaSemana)
  const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - inicio.getTime()) / 86400000 + 1) / 7)
  return { week, year: t.getUTCFullYear() }
}
