const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function partesFecha(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return {
    dow: DIAS_CORTOS[dia],
    num: String(d),
    diaSemana: DIAS[dia],
    largo: `${DIAS[dia]} ${d} de ${MESES[m - 1]}`,
    corto: `${DIAS_CORTOS[dia]} ${d} ${MESES_CORTOS[m - 1]}`,
    domingo: dia === 0,
  }
}

export function capitalizar(s: string): string {
  return s.charAt(0).toLocaleUpperCase('es') + s.slice(1)
}

export function euros(precio: number, desde: boolean): string {
  const cifra = Number.isInteger(precio) ? String(precio) : precio.toFixed(2).replace('.', ',')
  return `${desde ? 'Desde ' : ''}${cifra} €`
}
