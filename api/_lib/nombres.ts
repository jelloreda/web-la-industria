function capitalizar(p: string): string {
  return p ? p.charAt(0).toLocaleUpperCase('es') + p.slice(1).toLocaleLowerCase('es') : p
}

export function normalizarNombre(entrada: string): string {
  return entrada.replace(/\u2019/g, "'").trim().split(/\s+/).filter(Boolean)
    .map(palabra => palabra.split('-').map(capitalizar).join('-'))
    .join(' ')
}

export function nombreValido(normalizado: string): boolean {
  return normalizado.length <= 60
    && normalizado.split(' ').length >= 2
    && /^[\p{L}' -]+$/u.test(normalizado)
}

export function separarNombre(normalizado: string): { name: string; lastname: string } {
  const [name, ...resto] = normalizado.split(' ')
  return { name, lastname: resto.join(' ') }
}
