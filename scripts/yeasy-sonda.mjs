// scripts/yeasy-sonda.mjs
// Uso:
//   node scripts/yeasy-sonda.mjs lectura
//   SONDA_TELEFONO=+346XXXXXXXX node scripts/yeasy-sonda.mjs escritura --confirmo
// Lee YEASY_API_TOKEN y YEASY_LOCATION_1_USER_UUID del .env del MCP sin imprimirlos.
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

const ENV_MCP = path.resolve(process.cwd(), '../contabilidad-la-industria/yeasy-mcp-server/.env')
const env = Object.fromEntries(
  fs.readFileSync(ENV_MCP, 'utf8').split('\n')
    .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]),
)
const API = 'https://api.yeasy.io'
const G = '6f554a4a-15ea-4752-9ea5-985791a6c972'
const A = 'c14b04a8-a151-41e4-b042-0f8c5c678b42'
const FIX = path.resolve('tests-unit/fixtures')

async function y(ruta, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-app-version': '2.1.0' }
  if (auth) headers.Authorization = `Bearer ${env.YEASY_API_TOKEN}`
  const res = await fetch(API + ruta, { method, headers, body: body && JSON.stringify(body) })
  const texto = await res.text()
  let datos; try { datos = JSON.parse(texto) } catch { datos = texto }
  return { status: res.status, datos }
}
const guardar = (nombre, datos) => fs.writeFileSync(path.join(FIX, nombre), JSON.stringify(datos, null, 2))
const madrid = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d)
const masDias = n => madrid(new Date(Date.now() + n * 86400000))

async function lectura() {
  fs.mkdirSync(FIX, { recursive: true })
  const sg = await y(`/services/clientweb?commerce=${G}`); guardar('servicios-guzman.json', sg.datos)
  const sa = await y(`/services/clientweb?commerce=${A}`); guardar('servicios-arguelles.json', sa.datos)
  const eg = await y(`/employee/commerce/${G}`)
  // Solo los campos que usamos: nada de emails, teléfonos ni permisos en el repo.
  guardar('empleados-guzman.json', eg.datos.map(({ uuid, name, position, image }) => ({ uuid, name, position, image })))
  const corte = sg.datos.find(s => s.order === 0)
  const dia = masDias(2)
  const d = await y('/availability', { method: 'POST', body: { commerce: G, date: dia, servicesDuration: corte.defaultDuration, serviceCollection: [corte], userTimezone: 'Europe/Madrid' } })
  guardar('disponibilidad-guzman.json', d.datos)
  const todos = d.datos.find(e => e.employee.uuid === 'all')
  const varios = todos && Object.values(todos.availability).flat().find(h => h.employee.length > 1)
  console.log('availability status', d.status, 'fecha', dia, 'entradas', d.datos.length)
  console.log('¿"Cualquiera" lista varios barbers en un hueco?', Boolean(varios))
  console.log('franjas presentes', [...new Set(d.datos.flatMap(e => Object.keys(e.availability)))])
}

async function escritura() {
  if (!process.argv.includes('--confirmo')) throw new Error('Falta --confirmo')
  const tel = process.env.SONDA_TELEFONO
  if (!/^\+\d{9,14}$/.test(tel ?? '')) throw new Error('SONDA_TELEFONO en formato +34XXXXXXXXX')

  const nuevo = await y('/customer/commerce', { method: 'POST', auth: true, body: { name: 'Prueba', lastname: 'Web Reservas', email: '', phone: tel, password: randomBytes(18).toString('base64url'), createdBy: G, createdByCommerce: true } })
  console.log('1) crear cliente con email vacío →', nuevo.status, nuevo.datos?.uuid ? 'uuid ok' : nuevo.datos)
  const cliente = nuevo.datos
  const lista = await y(`/customer/commerceAndCreatedBynewV2/${G}`, { auth: true })
  console.log('2) aparece en la lista de la sede →', lista.datos.some(c => c.uuid === cliente.uuid))

  const corte = (await y(`/services/clientweb?commerce=${G}`)).datos.find(s => s.order === 0)
  const dia = masDias(20)
  const disp = (await y('/availability', { method: 'POST', body: { commerce: G, date: dia, servicesDuration: corte.defaultDuration, serviceCollection: [corte], userTimezone: 'Europe/Madrid' } })).datos
  const hueco = disp.find(e => e.employee.uuid === 'all').availability.evening?.at(-1)
    ?? disp.find(e => e.employee.uuid === 'all').availability.afternoon.at(-1)
  const [h, m] = hueco.label.split(':').map(Number)
  const semana = (() => { const t = new Date(`${dia}T00:00:00Z`); const d = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - d); const i = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return { week: Math.ceil(((t - i) / 86400000 + 1) / 7), year: t.getUTCFullYear() } })()
  const cuerpo = {
    commerce: G, customer: cliente.uuid, week: semana.week, year: semana.year, commerceSettedUuid: G,
    startsDay: dia, startsHour: h, startsMinute: m, chargeId: null, subsCode: '', inasistanceValue: 0,
    paymentMethod: null, paymentSettedUuid: '', duration: corte.defaultDuration, message: '',
    asignedTo: hueco.employee[0].uuid, service: [corte], status: 'Pendiente', createdBy: '',
    createdUUID: cliente.uuid, createdByType: 'customer', isDeleted: false, customerSelected: false, source: 'web',
  }
  const cita = await y('/booking', { method: 'POST', auth: true, body: cuerpo })
  console.log('3) POST /booking modo cliente →', cita.status, cita.datos?.uuid ? 'uuid ok' : cita.datos)
  if (cita.datos?.uuid) {
    const leida = await y(`/booking/${cita.datos.uuid}`, { auth: true })
    console.log('   guardada como', { createdByType: leida.datos.createdByType, source: leida.datos.source, status: leida.datos.status })
    console.log('   claves de notificación en la cita →', Object.keys(leida.datos).filter(k => /notif/i.test(k)))
    const tipo = v => `${typeof v} ${JSON.stringify(v)}`
    const mias = await y(`/booking/findBookingsByCommerce/${G}/customer/${cliente.uuid}`, { auth: true })
    const lectura = (Array.isArray(mias.datos) ? mias.datos : []).find(b => b.uuid === cita.datos.uuid)
    console.log('   findBookingsByCommerce →', mias.status, lectura ? {
      startsDay: tipo(lectura.startsDay), startsHour: tipo(lectura.startsHour), startsMinute: tipo(lectura.startsMinute),
      status: tipo(lectura.status), 'asignedTo.name': tipo(lectura.asignedTo?.name),
      week: `${tipo(lectura.week)} (calculado ${semana.week})`, year: `${tipo(lectura.year)} (calculado ${semana.year})`,
    } : 'cita no encontrada')
    const libre = await y('/availability/employee', { method: 'POST', auth: true, body: { date: dia, hour: h, minute: m, employee: hueco.employee[0].uuid, servicesDuration: corte.defaultDuration, serviceCollection: [corte], userTimezone: 'Europe/Madrid' } })
    console.log('   /availability/employee (esperado false) →', libre.status, libre.datos)
    const limite = await y('/booking/limit', { method: 'POST', auth: true, body: { duration: corte.defaultDuration, hour: h, minute: m, date: dia, employee: { uuid: hueco.employee[0].uuid }, commerce: { uuid: G } } })
    console.log('   /booking/limit length (esperado > 0) →', limite.status, Array.isArray(limite.datos) ? limite.datos.length : limite.datos)
    const disp2 = await y('/availability', { method: 'POST', body: { commerce: G, date: dia, servicesDuration: corte.defaultDuration, serviceCollection: [corte], userTimezone: 'Europe/Madrid' } })
    const propia = Array.isArray(disp2.datos) ? disp2.datos.find(e => e.employee.uuid === hueco.employee[0].uuid) : null
    const aun = propia && Object.values(propia.availability).flat().some(x => x.label === hueco.label)
    console.log('   /availability: ¿el hueco sigue ofrecido a ese barber? (esperado false) →', Boolean(aun))
    const guardado = (Array.isArray(lista.datos) ? lista.datos : []).find(c => c.uuid === cliente.uuid)
    console.log('   teléfono guardado (formato) →', String(guardado?.phone ?? '').replace(/\d/g, '9'))
    console.log('4) Revisa AHORA si llegó algo a AMBOS: el teléfono del cliente de prueba (SMS / WhatsApp / email / push) y la app del barber asignado. Tienes 60 s.')
    await new Promise(r => setTimeout(r, 60000))
    const borrar = await y(`/booking/no-notification/${cita.datos.uuid}`, { method: 'DELETE', auth: true })
    console.log('   cita borrada sin notificar →', borrar.status)
  }
  const bc = await y(`/customer/${cliente.uuid}`, { method: 'DELETE', auth: true })
  console.log('5) cliente de prueba borrado →', bc.status)
}

const modo = process.argv[2]
if (modo === 'lectura') await lectura()
else if (modo === 'escritura') await escritura()
else console.log('Uso: node scripts/yeasy-sonda.mjs lectura | escritura --confirmo')
