# Reserva integrada con Yeasy — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la sección Servicios y los enlaces a Yeasy por un flujo de reserva propio (sede → servicio → día/barber/hora → nombre y teléfono → confirmación) que lee y escribe en la agenda real de Yeasy.

**Architecture:** Tres Vercel Functions en `api/reservas/*` (raíz del repo) hacen de única puerta a `api.yeasy.io`. Leen servicios, empleados y huecos de los endpoints públicos, y buscan/crean clientes y citas con el token de administrador, que solo vive en el servidor. La web (React + Vite, un único `index.html`) abre un panel con Radix Dialog que habla solo con `/api/reservas/*`.

**Tech Stack:**
- Servidor: Vercel Functions (Node, handlers web `GET`/`POST`), TypeScript, `zod`, `libphonenumber-js`.
- Web: React 18, Tailwind, Radix Dialog.
- Tests: `vitest` (unitarios de servidor y lógica de cliente) y Playwright (e2e con la API simulada).

**Spec:** `docs/superpowers/specs/2026-09-29-reserva-integrada-design.md`. Diseño visual: https://claude.ai/artifact/JiTUuxoMHQ9Zfk9NHtg65k

## Global Constraints

- **Idioma:** todo el copy en español, tuteo, sin exclamaciones. El verbo de los CTA de reserva es siempre "Reservar".
- **Colores:** solo los tokens de Tailwind (`carbon`, `dark2`, `gray-stone`, `arena`, `cream`, `cream-bg`) más las líneas `#4a4948` / `#ddd8d0` ya usadas. Esquinas rectas, sin sombras.
- **Tipografía:** `font-coolvetica` en títulos, `font-work-sans` en el resto.
- **Token:** `YEASY_API_TOKEN` solo se lee en `api/_lib/yeasy.ts`. Nunca se registra en logs ni se devuelve.
- **Datos personales:** los logs nunca incluyen teléfono completo ni nombre (solo las 3 últimas cifras). Ninguna respuesta de la API revela si un teléfono ya es cliente.
- **Rango reservable:** hoy + 6 días en `Europe/Madrid`. Los domingos, cerrado.
- **Teléfono:**
  - Con `+34`: 9 cifras que empiecen por 6–9.
  - Con otro prefijo: 6–12 cifras.
  - Se guarda en E.164 (`+34612345678`).
  - Prefijos permitidos: `+34 +351 +33 +39 +44 +49 +1 +52 +57 +58 +54`.
- **Nombre:** mínimo 2 palabras y máximo 60 caracteres. Se guarda con la primera letra de cada palabra (y de cada parte con guion) en mayúscula y el resto en minúscula.
- **Servicios visibles:** `isPublic && !isDeleted` y `order` menor que el del separador (el servicio cuyo nombre contiene "extras").
- **Barbers visibles:** con al menos un hueco ese día y `position` sin "admin". Se usa `POST /availability`, **nunca** `/availability/v2`.
- **Códigos de error de la API propia:** `DATOS_INVALIDOS` (422), `HUECO_OCUPADO` (409), `NO_DISPONIBLE` (409), `AGENDA_NO_DISPONIBLE` (503).
- **Commits:** terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Rama:** `feat/reserva-integrada`.

## Review Focus

1. **Hueco pasado de hoy.** Si el cliente abre la web a las 19:40, un hueco de las 19:30 no debe ofrecerse ni aceptarse. Lo cubren `aHuecosPublicos` (filtra por `ahora`) y su test en la Task 5.
2. **Doble envío.** El mismo cliente pulsa dos veces o reintenta tras un corte de red. No debe crearse una segunda cita ni recibir "hora ocupada" por su propia cita. Lo cubren el chequeo de cita previa en `crearReserva` (test "duplicado" de la Task 7) y el botón deshabilitado mientras envía (Task 11).
3. **Teléfono ya guardado en Yeasy con guiones o sin `+`** (`+3461-234-5678`). Debe encontrarse y no duplicar el cliente. Lo cubren `mismoTelefono` (Task 2) y el test "cliente existente" (Task 7).
4. **Barber elegido que no trabaja el día al que se cambia.** Debe pasar a "Cualquiera" con aviso, no quedarse sin huecos. Lo cubre el e2e de la Task 10.
5. **Llamada directa a la API saltándose la web:** servicio Extra, fecha fuera de rango u hora inventada. Debe responder 422 o 409 sin tocar Yeasy en escritura. Lo cubren los tests de `validarPeticion` y `buscarServicio` (Tasks 4 y 7).

---

## Mapa de archivos

**Servidor (nuevo, raíz del repo):**

| Archivo | Responsabilidad |
|---|---|
| `api/_lib/tipos.ts` | Tipos compartidos servidor/web (`SedeId`, `ServicioPublico`, `RespuestaHuecos`, `PeticionReserva`, `CitaConfirmada`, `CodigoError`). |
| `api/_lib/errores.ts` | `ErrorReserva` (código, status, campos). |
| `api/_lib/http.ts` | `json()`, `errorJson()`, `manejarError()`. |
| `api/_lib/fecha.ts` | Fecha de Madrid, rango de 7 días, semana ISO. |
| `api/_lib/nombres.ts` | Normalizar, validar y separar el nombre. |
| `api/_lib/telefono.ts` | Validar y pasar a E.164; comparar teléfonos por cifras. |
| `api/_lib/yeasy.ts` | Cliente HTTP de Yeasy y tipos de sus respuestas. |
| `api/_lib/sedes.ts` | Sede → UUID de comercio y variable del UUID de usuario. |
| `api/_lib/servicios.ts` | Filtro, nombres limpios, `buscarServicio`. |
| `api/_lib/huecos.ts` | `/availability` + empleados → barbers y huecos públicos. |
| `api/_lib/clientes.ts` | Buscar por teléfono y crear. |
| `api/_lib/reservas.ts` | `validarPeticion` y `crearReserva` (orquestación). |
| `api/reservas/servicios.ts` | `GET /api/reservas/servicios`. |
| `api/reservas/huecos.ts` | `GET /api/reservas/huecos`. |
| `api/reservas/index.ts` | `POST /api/reservas`. |
| `tsconfig.json`, `vitest.config.mts` | Comprobación de tipos del servidor y tests unitarios. |
| `tests-unit/**` | Tests de vitest y sus datos. |
| `scripts/yeasy-sonda.mjs` | Sonda de contratos de la Task 0. |

**Web (`app/src/`):**

| Archivo | Cambio |
|---|---|
| `lib/brand.ts` | `SedeId` en `Location.id`, constante `BOOKING_MODE`. |
| `lib/booking-api.ts` | `fetch` tipado a `/api/reservas/*` y `ErrorApi`. |
| `lib/booking-validation.ts` | Validación de nombre y teléfono en cliente y lista de prefijos. |
| `components/booking/estado.ts` | Reducer del flujo. |
| `components/booking/formato.ts` | Fechas en español y euros. |
| `components/booking/useCarga.ts` | Hook de carga con caché mientras el panel está abierto. |
| `components/booking/piezas.tsx` | `Cuerpo`, `Pie`, `Etiqueta`, `BotonPrincipal`, `Esqueleto`, `AvisoError`, `Resumen`. |
| `components/booking/BookingProvider.tsx` | Contexto `useBooking().open(sedeId?)`. |
| `components/booking/BookingPanel.tsx` | Diálogo, cabecera, progreso y cambio de paso. |
| `components/booking/StepSede.tsx`, `StepServicio.tsx`, `StepHueco.tsx`, `StepDatos.tsx`, `StepConfirmacion.tsx` | Un paso cada uno. |
| `App.tsx`, `Nav.tsx`, `Hero.tsx`, `HeroCampaign.tsx`, `Booking.tsx`, `Contact.tsx` | Los CTA pasan a `open()`. Quitar Servicios. Colores del Hero. |
| `components/Services.tsx`, `components/LocationPicker.tsx` | Borrar. |

**Nota sobre la spec:** los UUID de comercio viven en `api/_lib/sedes.ts` y no en `brand.ts` (§8 de la spec), porque solo los usa el servidor. El botón del estado "sin huecos" lleva al siguiente día **abierto** (no domingo), no al siguiente día con huecos garantizados: así evitamos pedir los 7 días de golpe.

**Tests e2e:** `playwright.config.ts` (servidor estático + `baseURL`), `tests/mocks/reservas.ts`, `tests/la-industria.spec.ts`, `tests/reserva.spec.ts`.

---

### Task 0: Contratos reales de Yeasy

Confirma lo que la spec deja abierto (§4.4) y guarda respuestas reales como fixtures. **La parte de escritura crea y borra un cliente y una cita reales: no se ejecuta sin un "sí" explícito de Jaime en el chat en ese momento, y con un teléfono de prueba que él controle.**

**Files:**
- Create: `scripts/yeasy-sonda.mjs`
- Create: `tests-unit/fixtures/servicios-guzman.json`, `tests-unit/fixtures/servicios-arguelles.json`, `tests-unit/fixtures/empleados-guzman.json`, `tests-unit/fixtures/disponibilidad-guzman.json`
- Modify: `docs/superpowers/specs/2026-09-29-reserva-integrada-design.md` (añadir §13 "Resultados de la Tarea 0")

**Interfaces:**
- Produces:
  - Los fixtures JSON que usa el test de contrato de la Task 5.
  - La decisión `MODO_CITA = 'cliente' | 'comercio'` que usa la Task 7.

- [ ] **Step 1: Escribir la sonda**

```js
// scripts/yeasy-sonda.mjs
// Uso:
//   node scripts/yeasy-sonda.mjs lectura
//   SONDA_TELEFONO=+346XXXXXXXX node scripts/yeasy-sonda.mjs escritura --confirmo
// Lee YEASY_API_TOKEN y YEASY_LOCATION_1_USER_UUID del .env del MCP sin imprimirlos.
import fs from 'node:fs'
import path from 'node:path'

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
  const user = env.YEASY_LOCATION_1_USER_UUID

  const nuevo = await y('/customer/commerce', { method: 'POST', auth: true, body: { name: 'Prueba', lastname: 'Web Reservas', email: '', phone: tel, password: '', createdBy: user, createdByCommerce: true } })
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
    console.log('4) Revisa AHORA si al teléfono de prueba le llegó SMS / WhatsApp / email / push. Tienes 60 s.')
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
```

- [ ] **Step 2: Ejecutar la parte de lectura**

Run: `node scripts/yeasy-sonda.mjs lectura`
Expected:
- Se crean los 4 JSON en `tests-unit/fixtures/`.
- Por consola salen `availability status 200`, si "Cualquiera" lista varios barbers en un hueco y las franjas presentes (`morning`, `afternoon` y quizá `evening`).
- Comprueba con `grep -c '"phone"' tests-unit/fixtures/*.json` que sale 0 en todos (sin datos personales).

- [ ] **Step 3: Pedir permiso y ejecutar la parte de escritura**

Escribe en el chat: "La sonda de escritura va a crear un cliente 'Prueba Web Reservas' con tu teléfono de prueba y una cita en Guzmán dentro de 20 días a última hora, y a borrar ambos a los 60 s. ¿La lanzo? Pásame el teléfono de prueba." Espera el sí.
Run: `SONDA_TELEFONO=<el que dé Jaime> node scripts/yeasy-sonda.mjs escritura --confirmo`
Expected: los pasos 1) a 5) con status 2xx. Pregunta a Jaime si le llegó alguna notificación.

**Si el paso 3) falla (4xx) con `POST /booking`**, repite a mano con el cuerpo del MCP (`POST /booking/commerce`, ver la Task 7, `cuerpoCitaComercio`) y anota ese resultado. Si queda cliente o cita sin borrar, bórralos con los mismos endpoints `DELETE`.

- [ ] **Step 4: Anotar los resultados en la spec**

Añade al final de la spec:

```markdown
## 13. Resultados de la Tarea 0 (AAAA-MM-DD)

| Pregunta | Resultado |
|---|---|
| Crear cliente con `email: ""` | <status y si devolvió uuid> |
| El cliente creado aparece en `commerceAndCreatedBynewV2` de la sede | <sí/no> |
| `POST /booking` modo cliente con el token de administrador | <status; createdByType y source guardados> |
| Notificación al cliente | <qué llegó, si llegó algo> |
| "Cualquiera" lista varios barbers en un hueco | <sí/no> |
| Franjas presentes | <morning/afternoon/evening> |
| **Decisión `MODO_CITA`** | `'cliente'` si `POST /booking` dio 2xx; si no, `'comercio'` |
```

- [ ] **Step 5: Commit**

```bash
git add scripts/yeasy-sonda.mjs tests-unit/fixtures docs/superpowers/specs/2026-09-29-reserva-integrada-design.md
git commit -m "Capture Yeasy API contracts for integrated booking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Base del servidor (herramientas, tipos, errores, fechas)

**Files:**
- Modify: `package.json` (raíz)
- Create: `tsconfig.json`, `vitest.config.mts`, `api/_lib/tipos.ts`, `api/_lib/errores.ts`, `api/_lib/http.ts`, `api/_lib/fecha.ts`
- Test: `tests-unit/fecha.test.ts`, `tests-unit/http.test.ts`

**Interfaces:**
- Produces:
  - `SedeId`, `Franja`, `ServicioPublico`, `BarberoPublico`, `HuecoPublico`, `RespuestaServicios`, `RespuestaHuecos`, `PeticionReserva`, `CitaConfirmada`, `CodigoError`, `RespuestaError` (tipos).
  - `class ErrorReserva(codigo: CodigoError, status: number, campos?: string[])`.
  - `json(data, status?, cache?)`, `errorJson(codigo, status, campos?)`, `manejarError(e): Response`.
  - `fechaMadrid(d: Date): string`, `sumarDias(fecha: string, n: number): string`, `rangoReservable(ahora: Date): string[]`, `esFechaReservable(fecha: string, ahora: Date): boolean`, `semanaIso(fecha: string): { week: number; year: number }`.

- [ ] **Step 1: Instalar dependencias y configurar**

Run:
```bash
npm install zod@^3.25.0 libphonenumber-js@^1.12.0
npm install -D vitest@^3.2.0 typescript@^5.6.3
```

En `package.json` de la raíz, sustituye `"scripts": {}` por:

```json
  "scripts": {
    "test": "vitest run",
    "typecheck:api": "tsc -p tsconfig.json"
  },
```

Crea `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["api"]
}
```

Crea `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./app/src', import.meta.url)) } },
  test: {
    include: ['tests-unit/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
})
```

- [ ] **Step 2: Escribir los tipos, errores y utilidades HTTP**

`api/_lib/tipos.ts`:

```ts
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
```

`api/_lib/errores.ts`:

```ts
import type { CodigoError } from './tipos'

export class ErrorReserva extends Error {
  constructor(public codigo: CodigoError, public status: number, public campos?: string[]) {
    super(codigo)
  }
}
```

`api/_lib/http.ts`:

```ts
import { ErrorReserva } from './errores'
import type { CodigoError } from './tipos'

export function json(data: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

export function errorJson(error: CodigoError, status: number, campos?: string[]): Response {
  return json(campos && campos.length ? { error, campos } : { error }, status)
}

export function manejarError(e: unknown): Response {
  if (e instanceof ErrorReserva) return errorJson(e.codigo, e.status, e.campos)
  console.error('[reservas] error inesperado', e instanceof Error ? e.message : String(e))
  return errorJson('AGENDA_NO_DISPONIBLE', 503)
}
```

- [ ] **Step 3: Escribir los tests de fecha y http (fallarán)**

`tests-unit/fecha.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { esFechaReservable, fechaMadrid, rangoReservable, semanaIso, sumarDias } from '../api/_lib/fecha'

describe('fecha', () => {
  it('usa el día de Madrid, no el de UTC', () => {
    // 22:30 UTC del 29 = 00:30 del 30 en Madrid (CEST)
    expect(fechaMadrid(new Date('2026-09-29T22:30:00Z'))).toBe('2026-09-30')
    expect(fechaMadrid(new Date('2026-09-29T21:30:00Z'))).toBe('2026-09-29')
  })

  it('suma días cruzando de mes', () => {
    expect(sumarDias('2026-09-29', 3)).toBe('2026-10-02')
  })

  it('el rango son 7 días empezando hoy', () => {
    expect(rangoReservable(new Date('2026-10-01T07:00:00Z'))).toEqual([
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
    ])
  })

  it('rechaza ayer, el día 8 y formatos raros', () => {
    const ahora = new Date('2026-10-01T07:00:00Z')
    expect(esFechaReservable('2026-10-01', ahora)).toBe(true)
    expect(esFechaReservable('2026-10-07', ahora)).toBe(true)
    expect(esFechaReservable('2026-09-30', ahora)).toBe(false)
    expect(esFechaReservable('2026-10-08', ahora)).toBe(false)
    expect(esFechaReservable('1/10/2026', ahora)).toBe(false)
  })

  it('calcula la semana ISO como Yeasy', () => {
    expect(semanaIso('2026-09-29')).toEqual({ week: 40, year: 2026 })
    expect(semanaIso('2026-10-01')).toEqual({ week: 40, year: 2026 })
    expect(semanaIso('2027-01-01')).toEqual({ week: 53, year: 2026 })
  })
})
```

`tests-unit/http.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { ErrorReserva } from '../api/_lib/errores'
import { manejarError } from '../api/_lib/http'

describe('manejarError', () => {
  it('traduce ErrorReserva a su status y cuerpo', async () => {
    const r = manejarError(new ErrorReserva('DATOS_INVALIDOS', 422, ['telefono']))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['telefono'] })
  })

  it('cualquier otro error es 503 sin detalles', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = manejarError(new Error('boom'))
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'AGENDA_NO_DISPONIBLE' })
  })
})
```

- [ ] **Step 4: Ejecutar para ver el fallo**

Run: `npm test`
Expected: `fecha.test.ts` FAIL con "Failed to resolve import ../api/_lib/fecha". `http.test.ts` PASS.

- [ ] **Step 5: Implementar `api/_lib/fecha.ts`**

```ts
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
```

- [ ] **Step 6: Ejecutar tests y comprobación de tipos**

Run: `npm test && npm run typecheck:api`
Expected: 7 tests PASS; `tsc` sin errores.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.mts api/_lib tests-unit/fecha.test.ts tests-unit/http.test.ts
git commit -m "Add server toolchain, shared types and Madrid date helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Nombre y teléfono

**Files:**
- Create: `api/_lib/nombres.ts`, `api/_lib/telefono.ts`
- Test: `tests-unit/nombres.test.ts`, `tests-unit/telefono.test.ts`

**Interfaces:**
- Produces:
  - `normalizarNombre(s: string): string`, `nombreValido(normalizado: string): boolean`, `separarNombre(normalizado: string): { name: string; lastname: string }`.
  - `PREFIJOS: readonly string[]`, `aE164(prefijo: string, numero: string): string | null`, `soloCifras(t: string): string`, `mismoTelefono(e164: string, deYeasy?: string | null): boolean`.

- [ ] **Step 1: Escribir los tests (fallarán)**

`tests-unit/nombres.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { nombreValido, normalizarNombre, separarNombre } from '../api/_lib/nombres'

describe('nombres', () => {
  it('pone mayúscula inicial y el resto en minúscula', () => {
    expect(normalizarNombre('  álvaro   MARTÍN  ')).toBe('Álvaro Martín')
    expect(normalizarNombre('maría josé garcía-PÉREZ')).toBe('María José García-Pérez')
  })

  it('exige nombre y al menos un apellido, hasta 60 caracteres, solo letras', () => {
    expect(nombreValido('Álvaro Martín')).toBe(true)
    expect(nombreValido('Álvaro')).toBe(false)
    expect(nombreValido('A'.repeat(40) + ' ' + 'B'.repeat(25))).toBe(false)
    expect(nombreValido('Juan 1234')).toBe(false)
    expect(nombreValido("Seán O'neill")).toBe(true)
  })

  it('separa la primera palabra del resto', () => {
    expect(separarNombre('María José García')).toEqual({ name: 'María', lastname: 'José García' })
  })
})
```

`tests-unit/telefono.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { aE164, mismoTelefono } from '../api/_lib/telefono'

describe('telefono', () => {
  it('acepta móviles y fijos españoles y devuelve E.164', () => {
    expect(aE164('+34', '612 345 678')).toBe('+34612345678')
    expect(aE164('+34', '612-34-56-78')).toBe('+34612345678')
    expect(aE164('+34', '912345678')).toBe('+34912345678')
  })

  it('rechaza números españoles mal formados', () => {
    expect(aE164('+34', '512345678')).toBeNull()
    expect(aE164('+34', '61234567')).toBeNull()
    expect(aE164('+34', '6123456789')).toBeNull()
    expect(aE164('+34', 'abc')).toBeNull()
  })

  it('acepta prefijos extranjeros válidos y rechaza los no permitidos', () => {
    expect(aE164('+44', '7911 123456')).toBe('+447911123456')
    expect(aE164('+99', '612345678')).toBeNull()
    expect(aE164('+44', '123')).toBeNull()
  })

  it('compara por cifras aunque Yeasy lo guarde con guiones', () => {
    expect(mismoTelefono('+34612345678', '+3461-234-5678')).toBe(true)
    expect(mismoTelefono('+34612345678', '+34612345679')).toBe(false)
    expect(mismoTelefono('+34612345678', null)).toBe(false)
    expect(mismoTelefono('+34612345678', '')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `npm test -- nombres telefono`
Expected: FAIL, "Failed to resolve import".

- [ ] **Step 3: Implementar**

`api/_lib/nombres.ts`:

```ts
function capitalizar(p: string): string {
  return p ? p.charAt(0).toLocaleUpperCase('es') + p.slice(1).toLocaleLowerCase('es') : p
}

export function normalizarNombre(entrada: string): string {
  return entrada.trim().split(/\s+/).filter(Boolean)
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
```

`api/_lib/telefono.ts`:

```ts
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export const PREFIJOS = ['+34', '+351', '+33', '+39', '+44', '+49', '+1', '+52', '+57', '+58', '+54'] as const

export function soloCifras(t: string): string {
  return t.replace(/\D/g, '')
}

export function aE164(prefijo: string, numero: string): string | null {
  if (!(PREFIJOS as readonly string[]).includes(prefijo)) return null
  const limpio = numero.replace(/[\s.\-()]/g, '')
  if (!/^\d{6,12}$/.test(limpio)) return null
  if (prefijo === '+34' && !/^[6789]\d{8}$/.test(limpio)) return null
  const tel = parsePhoneNumberFromString(prefijo + limpio)
  return tel && tel.isValid() ? tel.number : null
}

export function mismoTelefono(e164: string, deYeasy?: string | null): boolean {
  return !!deYeasy && soloCifras(deYeasy) === soloCifras(e164)
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/nombres.ts api/_lib/telefono.ts tests-unit/nombres.test.ts tests-unit/telefono.test.ts
git commit -m "Add name normalization and phone validation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente de Yeasy y sedes

**Files:**
- Create: `api/_lib/yeasy.ts`, `api/_lib/sedes.ts`
- Create: `tests-unit/helpers/fetch-falso.ts`
- Test: `tests-unit/yeasy.test.ts`

**Interfaces:**
- Consumes: `ErrorReserva` (Task 1).
- Produces:
  - `yeasy<T>(ruta: string, opciones?: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; auth?: boolean; query?: Record<string, string> }): Promise<T>`, que lanza `ErrorReserva('AGENDA_NO_DISPONIBLE', 503)` ante cualquier fallo.
  - Tipos `YServicio`, `YEmpleado`, `YHueco`, `YDisponibilidad`, `YCliente`, `YCita`.
  - `sedePorId(id: string | null): SedeYeasy | null`, `userUuid(s: SedeYeasy): string`, `interface SedeYeasy { id: SedeId; commerceUuid: string; userUuidEnv: string }`.
  - Helper de test `fetchFalso(rutas: Record<string, Manejador>): Llamada[]`.

- [ ] **Step 1: Escribir el helper de fetch falso**

`tests-unit/helpers/fetch-falso.ts`:

```ts
import { vi } from 'vitest'

export type Manejador = (url: URL, cuerpo: unknown) => unknown
export interface Llamada { metodo: string; ruta: string; cuerpo: unknown; headers: Record<string, string> }

/**
 * Sustituye fetch. Las claves son regex sobre "MÉTODO /ruta", p. ej. 'GET /employee/commerce/.+'.
 * Si el manejador devuelve un Response se usa tal cual; si no, se serializa como JSON 200.
 */
export function fetchFalso(rutas: Record<string, Manejador>): Llamada[] {
  const llamadas: Llamada[] = []
  vi.stubGlobal('fetch', vi.fn(async (entrada: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(entrada))
    const metodo = init.method ?? 'GET'
    const cuerpo = init.body ? JSON.parse(String(init.body)) : undefined
    llamadas.push({ metodo, ruta: url.pathname, cuerpo, headers: (init.headers ?? {}) as Record<string, string> })
    const clave = `${metodo} ${url.pathname}`
    const ruta = Object.entries(rutas).find(([patron]) => new RegExp(`^${patron}$`).test(clave))
    if (!ruta) return new Response('no encontrado', { status: 404 })
    const r = ruta[1](url, cuerpo)
    return r instanceof Response ? r : new Response(JSON.stringify(r), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
  return llamadas
}
```

- [ ] **Step 2: Escribir el test (fallará)**

`tests-unit/yeasy.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { yeasy } from '../api/_lib/yeasy'
import { sedePorId, userUuid } from '../api/_lib/sedes'
import { ErrorReserva } from '../api/_lib/errores'
import { fetchFalso } from './helpers/fetch-falso'

describe('yeasy', () => {
  beforeEach(() => {
    vi.stubEnv('YEASY_API_TOKEN', 'token-de-prueba')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('manda el token solo cuando auth es true, y la versión de app siempre', async () => {
    const llamadas = fetchFalso({ 'GET /publico': () => ({ ok: 1 }), 'GET /privado': () => ({ ok: 2 }) })
    await yeasy('/publico')
    await yeasy('/privado', { auth: true })
    expect(llamadas[0].headers.Authorization).toBeUndefined()
    expect(llamadas[0].headers['x-app-version']).toBe('2.1.0')
    expect(llamadas[1].headers.Authorization).toBe('Bearer token-de-prueba')
  })

  it('añade la query y serializa el body', async () => {
    const llamadas = fetchFalso({ 'POST /availability': (url, cuerpo) => ({ q: url.searchParams.get('a'), cuerpo }) })
    const r = await yeasy<{ q: string; cuerpo: unknown }>('/availability', { method: 'POST', body: { x: 1 }, query: { a: 'b' } })
    expect(r).toEqual({ q: 'b', cuerpo: { x: 1 } })
    expect(llamadas[0].cuerpo).toEqual({ x: 1 })
  })

  it('convierte 401, 500 y fallos de red en AGENDA_NO_DISPONIBLE', async () => {
    fetchFalso({ 'GET /caducado': () => new Response('', { status: 401 }), 'GET /roto': () => new Response('', { status: 500 }) })
    await expect(yeasy('/caducado', { auth: true })).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE', status: 503 })
    await expect(yeasy('/roto')).rejects.toBeInstanceOf(ErrorReserva)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network') }))
    await expect(yeasy('/x')).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE' })
  })

  it('sin token no llama a Yeasy', async () => {
    vi.stubEnv('YEASY_API_TOKEN', '')
    const llamadas = fetchFalso({})
    await expect(yeasy('/x', { auth: true })).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE' })
    expect(llamadas).toHaveLength(0)
  })
})

describe('sedes', () => {
  it('resuelve solo las dos sedes conocidas', () => {
    expect(sedePorId('arguelles')?.commerceUuid).toBe('c14b04a8-a151-41e4-b042-0f8c5c678b42')
    expect(sedePorId('guzman-el-bueno')?.commerceUuid).toBe('6f554a4a-15ea-4752-9ea5-985791a6c972')
    expect(sedePorId('otra')).toBeNull()
    expect(sedePorId(null)).toBeNull()
    expect(sedePorId('toString')).toBeNull()
  })

  it('lee el usuario creador de su variable de entorno', () => {
    vi.stubEnv('YEASY_USER_UUID_ARGUELLES', 'u-a')
    expect(userUuid(sedePorId('arguelles')!)).toBe('u-a')
    vi.stubEnv('YEASY_USER_UUID_ARGUELLES', '')
    expect(() => userUuid(sedePorId('arguelles')!)).toThrow(ErrorReserva)
  })
})
```

- [ ] **Step 3: Ejecutar para ver el fallo**

Run: `npm test -- yeasy`
Expected: FAIL, "Failed to resolve import ../api/_lib/yeasy".

- [ ] **Step 4: Implementar**

`api/_lib/yeasy.ts`:

```ts
import { ErrorReserva } from './errores'

export const YEASY_API = 'https://api.yeasy.io'
const TIMEOUT_MS = 10_000

export interface YServicio {
  uuid: string; name: string; price: number; decimal: number; defaultDuration: number
  order: number; isPublic: boolean; isDeleted?: boolean
  [otro: string]: unknown
}
export interface YEmpleado { uuid: string; name: string; position?: string; image?: string | null }
export interface YHueco { date: string; label: string; employee: Array<{ uuid: string; name?: string }> }
export interface YDisponibilidad {
  employee: { uuid: string; name: string; image?: string | null }
  availability?: { morning?: YHueco[]; afternoon?: YHueco[]; evening?: YHueco[] }
}
export interface YCliente {
  uuid: string; name: string; lastname?: string; phone?: string | null; email?: string
  isBlocked?: boolean; isDeleted?: boolean
}
export interface YCita {
  uuid: string; startsDay: string; startsHour: number; startsMinute: number
  isDeleted?: boolean; asignedTo?: { name?: string } | null
}

interface Opciones {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  auth?: boolean
  query?: Record<string, string>
}

export async function yeasy<T>(ruta: string, { method = 'GET', body, auth = false, query }: Opciones = {}): Promise<T> {
  const url = new URL(ruta, YEASY_API)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-app-version': '2.1.0' }
  if (auth) {
    const token = process.env.YEASY_API_TOKEN
    if (!token) {
      console.error('[yeasy] falta YEASY_API_TOKEN')
      throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
    }
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(url, {
      method, headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    console.error('[yeasy] sin respuesta', method, url.pathname)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  if (!res.ok) {
    console.error('[yeasy] respuesta', res.status, method, url.pathname)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  return (await res.json()) as T
}
```

`api/_lib/sedes.ts`:

```ts
import { ErrorReserva } from './errores'
import type { SedeId } from './tipos'

export interface SedeYeasy { id: SedeId; commerceUuid: string; userUuidEnv: string }

const SEDES: Record<SedeId, SedeYeasy> = {
  'guzman-el-bueno': { id: 'guzman-el-bueno', commerceUuid: '6f554a4a-15ea-4752-9ea5-985791a6c972', userUuidEnv: 'YEASY_USER_UUID_GUZMAN' },
  arguelles: { id: 'arguelles', commerceUuid: 'c14b04a8-a151-41e4-b042-0f8c5c678b42', userUuidEnv: 'YEASY_USER_UUID_ARGUELLES' },
}

export function sedePorId(id: string | null): SedeYeasy | null {
  return id && Object.prototype.hasOwnProperty.call(SEDES, id) ? SEDES[id as SedeId] : null
}

export function userUuid(sede: SedeYeasy): string {
  const valor = process.env[sede.userUuidEnv]
  if (!valor) {
    console.error('[reservas] falta', sede.userUuidEnv)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  return valor
}
```

- [ ] **Step 5: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/yeasy.ts api/_lib/sedes.ts tests-unit/helpers tests-unit/yeasy.test.ts
git commit -m "Add Yeasy HTTP client and sede mapping

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Servicios (lógica + `GET /api/reservas/servicios`)

**Files:**
- Create: `api/_lib/servicios.ts`, `api/reservas/servicios.ts`
- Create: `tests-unit/helpers/datos.ts`
- Test: `tests-unit/servicios.test.ts`

**Interfaces:**
- Consumes: `yeasy`, `YServicio` (Task 3); `sedePorId` (Task 3); `json`, `errorJson`, `manejarError` (Task 1).
- Produces:
  - `limpiarNombre(n: string): string`, `aServiciosPublicos(lista: YServicio[]): ServicioPublico[]`, `serviciosDeSede(commerceUuid: string): Promise<YServicio[]>`.
  - `buscarServicio(commerceUuid: string, id: string): Promise<YServicio>`, que lanza `ErrorReserva('DATOS_INVALIDOS', 422, ['servicio'])` si no es un servicio visible.
  - `export async function GET(request: Request): Promise<Response>` en `api/reservas/servicios.ts`.
  - Datos de test `SVC_CORTE`, `SVC_TIJERA`, `SVC_NUEVO`, `SVC_EXTRA`, `SERVICIOS_Y`, `COMMERCE_G`, `CARLOS`, `WUILL`, `ADMIN`, `EMPLEADOS_Y`, `DISPONIBILIDAD_Y`, `AHORA`.

- [ ] **Step 1: Escribir los datos de test compartidos**

`tests-unit/helpers/datos.ts`:

```ts
import type { YDisponibilidad, YEmpleado, YServicio } from '../../api/_lib/yeasy'

export const COMMERCE_G = '6f554a4a-15ea-4752-9ea5-985791a6c972'
/** Jueves 1 oct 2026, 09:00 en Madrid */
export const AHORA = new Date('2026-10-01T07:00:00Z')

const svc = (uuid: string, name: string, price: number, defaultDuration: number, order: number, extra: Partial<YServicio> = {}): YServicio =>
  ({ uuid, name, price, decimal: 0, defaultDuration, order, isPublic: true, isDeleted: false, ...extra })

export const SVC_CORTE = svc('5029b0af-bd81-424d-bb85-8043fae859ea', 'Corte y Degradado a Maquina', 16, 30, 0)
export const SVC_TIJERA = svc('88a96e08-1721-413d-855d-e8349ffb4d6a', 'Corte Tijera y Barba desde ', 27, 60, 4)
export const SVC_NUEVO = svc('00000000-0000-4000-8000-000000000001', 'corte  niño+cejas(rápido)', 10, 20, 5, { decimal: 50 })
export const SVC_OCULTO = svc('00000000-0000-4000-8000-000000000002', 'Interno', 0, 30, 6, { isPublic: false })
export const SVC_BORRADO = svc('00000000-0000-4000-8000-000000000005', 'Viejo', 5, 30, 7, { isDeleted: true })
export const SVC_SEPARADOR = svc('00000000-0000-4000-8000-000000000003', '⬇️⬇️Extras ⬇️⬇️', 0, 15, 16)
export const SVC_EXTRA = svc('00000000-0000-4000-8000-000000000004', 'Cejas con pinza', 8, 15, 17)
/** Desordenados a propósito */
export const SERVICIOS_Y: YServicio[] = [SVC_EXTRA, SVC_TIJERA, SVC_SEPARADOR, SVC_CORTE, SVC_OCULTO, SVC_BORRADO, SVC_NUEVO]

export const CARLOS = '62db04ed-4eea-4b2e-8aff-f1e85a0e7cff'
export const WUILL = 'b08264da-ff25-43b1-83bf-c66b8c9670c0'
export const ADMIN = '5edbd80e-37e9-41ae-8c93-abab62be1d18'

export const EMPLEADOS_Y: YEmpleado[] = [
  { uuid: WUILL, name: 'Wuilliams', position: 'Barbero', image: 'https://res.cloudinary.com/df0dan3od/image/upload/v1/employees/w.jpg' },
  { uuid: CARLOS, name: 'Carlos ', position: '', image: null },
  { uuid: ADMIN, name: 'Admin', position: 'Admin', image: '' },
]

const hueco = (date: string, label: string, ...ids: string[]) => ({ date, label, employee: ids.map(uuid => ({ uuid, name: 'x' })) })

/** Disponibilidad del jueves 1 oct 2026 */
export const DISPONIBILIDAD_Y: YDisponibilidad[] = [
  { employee: { uuid: 'all', name: 'Cualquiera' }, availability: { morning: [hueco('2026-10-01T08:00:00.000Z', '10:00', CARLOS)], afternoon: [], evening: [] } },
  { employee: { uuid: WUILL, name: 'Wuilliams' }, availability: { morning: [], afternoon: [hueco('2026-10-01T15:30:00.000Z', '17:30', WUILL)], evening: [hueco('2026-10-01T18:30:00.000Z', '20:30', WUILL)] } },
  { employee: { uuid: CARLOS, name: 'Carlos' }, availability: {
    morning: [hueco('2026-10-01T06:30:00.000Z', '8:30', CARLOS), hueco('2026-10-01T08:00:00.000Z', '10:00', CARLOS)],
    afternoon: [hueco('2026-10-01T15:30:00.000Z', '17:30', CARLOS)],
    evening: [],
  } },
  { employee: { uuid: ADMIN, name: 'Admin' }, availability: { morning: [hueco('2026-10-01T09:00:00.000Z', '11:00', ADMIN)] } },
]
```

- [ ] **Step 2: Escribir el test (fallará)**

`tests-unit/servicios.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { aServiciosPublicos, buscarServicio, limpiarNombre } from '../api/_lib/servicios'
import { GET } from '../api/reservas/servicios'
import { fetchFalso } from './helpers/fetch-falso'
import { COMMERCE_G, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA } from './helpers/datos'

describe('servicios', () => {
  it('limpia nombres sin entrada en el mapa', () => {
    expect(limpiarNombre('corte  niño+cejas(rápido)')).toBe('Corte niño + cejas (rápido)')
    expect(limpiarNombre('Corte a tijera+taper(mullet,warrior,modcut)')).toBe('Corte a tijera + taper (mullet, warrior, modcut)')
    expect(limpiarNombre('Corte Tijera y Barba desde ')).toBe('Corte Tijera y Barba')
  })

  it('filtra, ordena, limpia y detecta "desde"', () => {
    expect(aServiciosPublicos(SERVICIOS_Y)).toEqual([
      { id: SVC_CORTE.uuid, nombre: 'Corte y degradado a máquina', precio: 16, desde: false, duracion: 30 },
      { id: '88a96e08-1721-413d-855d-e8349ffb4d6a', nombre: 'Corte a tijera y barba', precio: 27, desde: true, duracion: 60 },
      { id: '00000000-0000-4000-8000-000000000001', nombre: 'Corte niño + cejas (rápido)', precio: 10.5, desde: false, duracion: 20 },
    ])
  })

  it('sin separador no oculta nada público', () => {
    expect(aServiciosPublicos([SVC_EXTRA]).map(s => s.id)).toEqual([SVC_EXTRA.uuid])
  })

  it('buscarServicio rechaza extras y ids desconocidos', async () => {
    fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    await expect(buscarServicio(COMMERCE_G, SVC_CORTE.uuid)).resolves.toMatchObject({ uuid: SVC_CORTE.uuid })
    await expect(buscarServicio(COMMERCE_G, SVC_EXTRA.uuid)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS', campos: ['servicio'] })
    await expect(buscarServicio(COMMERCE_G, 'nope')).rejects.toMatchObject({ status: 422 })
  })
})

describe('GET /api/reservas/servicios', () => {
  it('devuelve los servicios de la sede con caché pública', async () => {
    const llamadas = fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=guzman-el-bueno'))
    expect(r.status).toBe(200)
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=600')
    expect((await r.json()).servicios).toHaveLength(3)
    expect(llamadas[0].ruta).toBe('/services/clientweb')
  })

  it('sede desconocida → 422 sin llamar a Yeasy', async () => {
    const llamadas = fetchFalso({})
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=madrid'))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['sede'] })
    expect(llamadas).toHaveLength(0)
  })

  it('Yeasy caído → 503', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchFalso({ 'GET /services/clientweb': () => new Response('', { status: 502 }) })
    const r = await GET(new Request('http://x/api/reservas/servicios?sede=arguelles'))
    expect(r.status).toBe(503)
  })
})
```

- [ ] **Step 3: Ejecutar para ver el fallo**

Run: `npm test -- servicios`
Expected: FAIL, "Failed to resolve import ../api/_lib/servicios".

- [ ] **Step 4: Implementar `api/_lib/servicios.ts`**

```ts
import { ErrorReserva } from './errores'
import type { ServicioPublico } from './tipos'
import { yeasy, type YServicio } from './yeasy'

/** Nombres limpios por UUID de servicio de Yeasy (los mismos en las dos sedes). */
const NOMBRES: Record<string, string> = {
  // Guzmán el Bueno
  '5029b0af-bd81-424d-bb85-8043fae859ea': 'Corte y degradado a máquina',
  '7bdc2cbf-a1b7-4a44-a6b4-1da3d78ba772': 'Cejas + corte y degradado',
  'f6f3d411-0c41-40cb-81c4-590b8aaa3758': 'Corte a tijera + taper (mullet, warrior, modcut)',
  'e9621d70-a956-4b8f-bb80-dd2a1a816f6a': 'Corte y degradado + barba',
  '88a96e08-1721-413d-855d-e8349ffb4d6a': 'Corte a tijera y barba',
  '64c2eaf8-22a1-46f7-a383-b7381701a614': 'Asesoramiento y corte',
  '72bef3d5-d132-47a6-bd0c-f42f7594de33': 'Corte de pelo premium',
  'af8edd41-53e2-4099-b085-66fd684f97a8': 'Corte y barba premium',
  '3ea39fec-77c2-4d42-a1db-aa8ada3083f0': 'Arreglo de barba',
  '1c140076-6260-451f-8e07-74bae0e94361': 'Corte jubilado',
  '364eaa22-3732-4843-abbb-b06d937c16ea': 'Corte a tijera corto',
  'e4b819c4-f81b-450c-8eb3-bbdce1eb4543': 'Corte a tijera clásico (M)',
  '98764bec-46f0-434e-b5a0-d99efea78824': 'Corte a tijera largo (L)',
  '78054898-30a7-4898-a867-51f68a59b1c2': 'Corte a tijera extra largo (XL)',
  '22bbddc6-e47f-4ee3-9ab2-bebb2d9a13ce': 'Limpieza facial + corte',
  'f5c2ea6c-4888-4b01-aa46-6af27979b92a': 'Limpieza facial + corte y barba',
  // Argüelles
  '5a3b79f1-a977-44a6-b2ad-a491ed56d405': 'Corte y degradado a máquina',
  '8206d001-5dff-41e1-9662-641a93318990': 'Cejas + corte y degradado',
  '828e15ba-b2a2-401c-9156-5f1967eaa4dd': 'Corte a tijera + taper (mullet, warrior, modcut)',
  '8647d980-f38f-4336-9c18-c9144325a455': 'Corte y degradado + barba',
  'be73e035-d69c-4b80-8577-c46e4a40cf1d': 'Corte a tijera y barba',
  '42a43644-9504-456c-babb-0d005d512af0': 'Asesoramiento y corte',
  '804abca9-4d88-4b49-b360-fdb3b8bb242a': 'Corte de pelo premium',
  '0c3a526d-c8ad-4d8d-ade0-d9ecf8516dd7': 'Corte y barba premium',
  '206c7a34-433d-4f54-8803-927e010d23a6': 'Arreglo de barba',
  'eef4180f-3f08-40a7-8a72-782e13bea206': 'Corte a tijera corto',
  'f2164712-4b2b-4343-9198-ae3b585aec66': 'Corte a tijera clásico (M)',
  '3e33df98-0f9d-4eec-8602-5ddb20622a3d': 'Corte a tijera largo (L)',
  'ea7e0600-3beb-49c8-83c5-73b34e298670': 'Corte a tijera extra largo (XL)',
  'faad9982-d736-4188-8d45-257cf950063b': 'Limpieza facial + corte',
  '705310ac-5e2d-483e-97bb-175a11d90cc4': 'Limpieza facial + corte y barba',
  '7e390455-18fd-4ca2-8327-18386bd65e9a': 'Corte jubilado',
  'aa6dd71d-17b4-40f6-923c-6c478b3e396d': 'Barba + cejas',
}

const DESDE = /\s+desde\s*$/i

export function limpiarNombre(nombre: string): string {
  const s = nombre.replace(DESDE, '').trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')')
  return s.charAt(0).toLocaleUpperCase('es') + s.slice(1)
}

export function aServiciosPublicos(lista: YServicio[]): ServicioPublico[] {
  const ordenados = [...lista].sort((a, b) => a.order - b.order)
  const separador = ordenados.find(s => /extras/i.test(s.name))
  return ordenados
    .filter(s => s.isPublic && !s.isDeleted && (!separador || s.order < separador.order))
    .map(s => ({
      id: s.uuid,
      nombre: NOMBRES[s.uuid] ?? limpiarNombre(s.name),
      precio: s.price + (s.decimal ?? 0) / 100,
      desde: DESDE.test(s.name),
      duracion: s.defaultDuration,
    }))
}

export function serviciosDeSede(commerceUuid: string): Promise<YServicio[]> {
  return yeasy<YServicio[]>('/services/clientweb', { query: { commerce: commerceUuid } })
}

export async function buscarServicio(commerceUuid: string, id: string): Promise<YServicio> {
  const lista = await serviciosDeSede(commerceUuid)
  const visible = aServiciosPublicos(lista).some(s => s.id === id)
  const servicio = lista.find(s => s.uuid === id)
  if (!visible || !servicio) throw new ErrorReserva('DATOS_INVALIDOS', 422, ['servicio'])
  return servicio
}
```

- [ ] **Step 5: Implementar `api/reservas/servicios.ts`**

```ts
import { errorJson, json, manejarError } from '../_lib/http'
import { sedePorId } from '../_lib/sedes'
import { aServiciosPublicos, serviciosDeSede } from '../_lib/servicios'

export async function GET(request: Request): Promise<Response> {
  const sede = sedePorId(new URL(request.url).searchParams.get('sede'))
  if (!sede) return errorJson('DATOS_INVALIDOS', 422, ['sede'])
  try {
    const servicios = aServiciosPublicos(await serviciosDeSede(sede.commerceUuid))
    return json({ servicios }, 200, 'public, s-maxage=300, stale-while-revalidate=600')
  } catch (e) {
    return manejarError(e)
  }
}
```

- [ ] **Step 6: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/servicios.ts api/reservas/servicios.ts tests-unit/helpers/datos.ts tests-unit/servicios.test.ts
git commit -m "Add services endpoint with extras filter and clean names

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Huecos (lógica + `GET /api/reservas/huecos`)

**Files:**
- Create: `api/_lib/huecos.ts`, `api/reservas/huecos.ts`
- Test: `tests-unit/huecos.test.ts`

**Interfaces:**
- Consumes: `yeasy`, `YDisponibilidad`, `YEmpleado`, `YServicio` (Task 3); `buscarServicio` (Task 4); `esFechaReservable` (Task 1); fixtures (Task 0); datos de test (Task 4).
- Produces:
  - `fotoCloudinary(url?: string | null): string | null`, `esPersonalReservable(e: YEmpleado): boolean`.
  - `aHuecosPublicos(fecha: string, disp: YDisponibilidad[], empleados: YEmpleado[], ahora: Date): RespuestaHuecos`.
  - `disponibilidad(commerceUuid: string, fecha: string, servicio: YServicio): Promise<YDisponibilidad[]>`, `empleadosDeSede(commerceUuid: string): Promise<YEmpleado[]>`.
  - `export async function GET(request: Request): Promise<Response>` en `api/reservas/huecos.ts`.

- [ ] **Step 1: Escribir el test (fallará)**

`tests-unit/huecos.test.ts`:

```ts
import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aHuecosPublicos, fotoCloudinary } from '../api/_lib/huecos'
import { GET } from '../api/reservas/huecos'
import { fetchFalso } from './helpers/fetch-falso'
import { AHORA, CARLOS, DISPONIBILIDAD_Y, EMPLEADOS_Y, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA, WUILL } from './helpers/datos'

describe('aHuecosPublicos', () => {
  it('agrupa por hora, quita huecos pasados, al personal admin y la entrada "all"', () => {
    expect(aHuecosPublicos('2026-10-01', DISPONIBILIDAD_Y, EMPLEADOS_Y, AHORA)).toEqual({
      fecha: '2026-10-01',
      barberos: [
        { id: WUILL, nombre: 'Wuilliams', foto: 'https://res.cloudinary.com/df0dan3od/image/upload/c_fill,g_face,w_200,h_200,q_80/v1/employees/w.jpg' },
        { id: CARLOS, nombre: 'Carlos', foto: null },
      ],
      huecos: [
        { hora: '10:00', franja: 'manana', barberos: [CARLOS] },
        { hora: '17:30', franja: 'tarde', barberos: [WUILL, CARLOS] },
        { hora: '20:30', franja: 'noche', barberos: [WUILL] },
      ],
    })
  })

  it('un barber sin huecos ese día no aparece', () => {
    const soloCarlos = DISPONIBILIDAD_Y.filter(d => d.employee.uuid !== WUILL)
    expect(aHuecosPublicos('2026-10-01', soloCarlos, EMPLEADOS_Y, AHORA).barberos.map(b => b.id)).toEqual([CARLOS])
  })

  it('a última hora del día no queda nada', () => {
    const tarde = new Date('2026-10-01T19:00:00Z')
    expect(aHuecosPublicos('2026-10-01', DISPONIBILIDAD_Y, EMPLEADOS_Y, tarde)).toEqual({ fecha: '2026-10-01', barberos: [], huecos: [] })
  })

  it('las fotos solo se transforman si son de Cloudinary', () => {
    expect(fotoCloudinary('')).toBeNull()
    expect(fotoCloudinary('https://otro.com/a.jpg')).toBe('https://otro.com/a.jpg')
  })

  it('contrato: la disponibilidad real capturada se mapea sin romperse', () => {
    const disp = JSON.parse(fs.readFileSync('tests-unit/fixtures/disponibilidad-guzman.json', 'utf8'))
    const emps = JSON.parse(fs.readFileSync('tests-unit/fixtures/empleados-guzman.json', 'utf8'))
    const r = aHuecosPublicos('2099-01-01', disp, emps, new Date(0))
    expect(r.barberos.every(b => b.id !== 'all' && !/admin/i.test(b.nombre))).toBe(true)
    expect(r.huecos.every(h => /^\d{1,2}:\d{2}$/.test(h.hora) && h.barberos.length > 0)).toBe(true)
  })
})

describe('GET /api/reservas/huecos', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(AHORA) })
  afterEach(() => { vi.useRealTimers() })

  const url = (q: string) => new Request(`http://x/api/reservas/huecos?${q}`)

  it('pide /availability (no v2) con el servicio de Yeasy y responde huecos', async () => {
    const llamadas = fetchFalso({
      'GET /services/clientweb': () => SERVICIOS_Y,
      'POST /availability': () => DISPONIBILIDAD_Y,
      'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-01`))
    expect(r.status).toBe(200)
    expect((await r.json()).huecos).toHaveLength(3)
    const pedido = llamadas.find(l => l.ruta === '/availability')!
    expect(pedido.cuerpo).toMatchObject({ date: '2026-10-01', servicesDuration: 30, userTimezone: 'Europe/Madrid', serviceCollection: [SVC_CORTE] })
    expect(llamadas.some(l => l.ruta === '/availability/v2')).toBe(false)
  })

  it('fecha fuera del rango de 7 días → 422', async () => {
    const llamadas = fetchFalso({})
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-08`))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['fecha'] })
    expect(llamadas).toHaveLength(0)
  })

  it('un extra no se puede consultar → 422 servicio', async () => {
    fetchFalso({ 'GET /services/clientweb': () => SERVICIOS_Y })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_EXTRA.uuid}&fecha=2026-10-01`))
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['servicio'] })
  })

  it('si Yeasy no devuelve un array se trata como día sin huecos', async () => {
    fetchFalso({
      'GET /services/clientweb': () => SERVICIOS_Y,
      'POST /availability': () => ({ message: 'cerrado' }),
      'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    })
    const r = await GET(url(`sede=guzman-el-bueno&servicio=${SVC_CORTE.uuid}&fecha=2026-10-04`))
    expect(await r.json()).toEqual({ fecha: '2026-10-04', barberos: [], huecos: [] })
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `npm test -- huecos`
Expected: FAIL, "Failed to resolve import ../api/_lib/huecos".

- [ ] **Step 3: Implementar `api/_lib/huecos.ts`**

```ts
import type { BarberoPublico, Franja, HuecoPublico, RespuestaHuecos } from './tipos'
import { yeasy, type YDisponibilidad, type YEmpleado, type YServicio } from './yeasy'

const FRANJAS: Array<['morning' | 'afternoon' | 'evening', Franja]> = [
  ['morning', 'manana'], ['afternoon', 'tarde'], ['evening', 'noche'],
]

export function fotoCloudinary(url?: string | null): string | null {
  if (!url) return null
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/c_fill,g_face,w_200,h_200,q_80/')
    : url
}

export function esPersonalReservable(e: YEmpleado): boolean {
  return !/admin/i.test(e.position ?? '')
}

export function aHuecosPublicos(fecha: string, disp: YDisponibilidad[], empleados: YEmpleado[], ahora: Date): RespuestaHuecos {
  const reservables = new Map(empleados.filter(esPersonalReservable).map(e => [e.uuid, e]))
  const porHora = new Map<string, { date: string; franja: Franja; barberos: string[] }>()
  const barberos: BarberoPublico[] = []

  for (const entrada of Array.isArray(disp) ? disp : []) {
    const emp = reservables.get(entrada.employee?.uuid)
    if (!emp) continue
    let tieneHuecos = false
    for (const [clave, franja] of FRANJAS) {
      for (const h of entrada.availability?.[clave] ?? []) {
        if (new Date(h.date).getTime() <= ahora.getTime()) continue
        tieneHuecos = true
        const actual = porHora.get(h.label) ?? { date: h.date, franja, barberos: [] }
        if (!actual.barberos.includes(emp.uuid)) actual.barberos.push(emp.uuid)
        porHora.set(h.label, actual)
      }
    }
    if (tieneHuecos) barberos.push({ id: emp.uuid, nombre: emp.name.trim(), foto: fotoCloudinary(emp.image) })
  }

  const huecos: HuecoPublico[] = [...porHora.entries()]
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .map(([hora, v]) => ({ hora, franja: v.franja, barberos: v.barberos }))

  return { fecha, barberos, huecos }
}

export async function disponibilidad(commerceUuid: string, fecha: string, servicio: YServicio): Promise<YDisponibilidad[]> {
  const r = await yeasy<unknown>('/availability', {
    method: 'POST',
    body: {
      commerce: commerceUuid, date: fecha,
      servicesDuration: servicio.defaultDuration, serviceCollection: [servicio],
      userTimezone: 'Europe/Madrid',
    },
  })
  return Array.isArray(r) ? (r as YDisponibilidad[]) : []
}

export function empleadosDeSede(commerceUuid: string): Promise<YEmpleado[]> {
  return yeasy<YEmpleado[]>(`/employee/commerce/${commerceUuid}`)
}
```

- [ ] **Step 4: Implementar `api/reservas/huecos.ts`**

```ts
import { esFechaReservable } from '../_lib/fecha'
import { errorJson, json, manejarError } from '../_lib/http'
import { aHuecosPublicos, disponibilidad, empleadosDeSede } from '../_lib/huecos'
import { sedePorId } from '../_lib/sedes'
import { buscarServicio } from '../_lib/servicios'

export async function GET(request: Request): Promise<Response> {
  const p = new URL(request.url).searchParams
  const sede = sedePorId(p.get('sede'))
  const servicioId = p.get('servicio') ?? ''
  const fecha = p.get('fecha') ?? ''
  const ahora = new Date()

  const campos = [
    !sede && 'sede',
    !servicioId && 'servicio',
    !esFechaReservable(fecha, ahora) && 'fecha',
  ].filter((c): c is string => Boolean(c))
  if (campos.length || !sede) return errorJson('DATOS_INVALIDOS', 422, campos)

  try {
    const servicio = await buscarServicio(sede.commerceUuid, servicioId)
    const [disp, empleados] = await Promise.all([
      disponibilidad(sede.commerceUuid, fecha, servicio),
      empleadosDeSede(sede.commerceUuid),
    ])
    return json(aHuecosPublicos(fecha, disp, empleados, ahora), 200, 'public, s-maxage=20, stale-while-revalidate=40')
  } catch (e) {
    return manejarError(e)
  }
}
```

- [ ] **Step 5: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS, incluido el test de contrato con los fixtures de la Task 0.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/huecos.ts api/reservas/huecos.ts tests-unit/huecos.test.ts
git commit -m "Add slots endpoint using per-day Yeasy availability

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Clientes (buscar por teléfono, crear)

**Files:**
- Create: `api/_lib/clientes.ts`
- Test: `tests-unit/clientes.test.ts`

**Interfaces:**
- Consumes: `yeasy`, `YCliente` (Task 3); `SedeYeasy`, `userUuid` (Task 3); `mismoTelefono` (Task 2); `separarNombre` (Task 2).
- Produces: `buscarClientePorTelefono(commerceUuid: string, e164: string): Promise<YCliente | null>`, `crearCliente(sede: SedeYeasy, nombre: string, e164: string): Promise<YCliente>`.

- [ ] **Step 1: Escribir el test (fallará)**

`tests-unit/clientes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buscarClientePorTelefono, crearCliente } from '../api/_lib/clientes'
import { sedePorId } from '../api/_lib/sedes'
import { fetchFalso } from './helpers/fetch-falso'
import { COMMERCE_G } from './helpers/datos'

const CLIENTES = [
  { uuid: 'c-borrado', name: 'Viejo', phone: '+34612345678', isDeleted: true, isBlocked: false },
  { uuid: 'c-1', name: 'Luis', lastname: 'Pérez', phone: '+3461-234-5678', isDeleted: false, isBlocked: false },
  { uuid: 'c-sin', name: 'Sin', phone: null },
]

describe('clientes', () => {
  beforeEach(() => {
    vi.stubEnv('YEASY_API_TOKEN', 't')
    vi.stubEnv('YEASY_USER_UUID_GUZMAN', 'u-g')
  })

  it('encuentra por cifras e ignora borrados, con token', async () => {
    const llamadas = fetchFalso({ 'GET /customer/commerceAndCreatedBynewV2/.+': () => CLIENTES })
    expect((await buscarClientePorTelefono(COMMERCE_G, '+34612345678'))?.uuid).toBe('c-1')
    expect(await buscarClientePorTelefono(COMMERCE_G, '+34699000000')).toBeNull()
    expect(llamadas[0].ruta).toBe(`/customer/commerceAndCreatedBynewV2/${COMMERCE_G}`)
    expect(llamadas[0].headers.Authorization).toBe('Bearer t')
  })

  it('crea el cliente sin email, con nombre separado y el usuario de la sede', async () => {
    const llamadas = fetchFalso({ 'POST /customer/commerce': (_u, cuerpo) => ({ uuid: 'nuevo', ...(cuerpo as object) }) })
    const c = await crearCliente(sedePorId('guzman-el-bueno')!, 'Álvaro Martín López', '+34611111111')
    expect(c.uuid).toBe('nuevo')
    expect(llamadas[0].cuerpo).toEqual({
      name: 'Álvaro', lastname: 'Martín López', email: '', phone: '+34611111111',
      password: '', createdBy: 'u-g', createdByCommerce: true,
    })
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `npm test -- clientes`
Expected: FAIL, "Failed to resolve import ../api/_lib/clientes".

- [ ] **Step 3: Implementar `api/_lib/clientes.ts`**

```ts
import { separarNombre } from './nombres'
import { userUuid, type SedeYeasy } from './sedes'
import { mismoTelefono } from './telefono'
import { yeasy, type YCliente } from './yeasy'

export async function buscarClientePorTelefono(commerceUuid: string, e164: string): Promise<YCliente | null> {
  const lista = await yeasy<YCliente[]>(`/customer/commerceAndCreatedBynewV2/${commerceUuid}`, { auth: true })
  return (Array.isArray(lista) ? lista : []).find(c => !c.isDeleted && mismoTelefono(e164, c.phone)) ?? null
}

export function crearCliente(sede: SedeYeasy, nombre: string, e164: string): Promise<YCliente> {
  const { name, lastname } = separarNombre(nombre)
  return yeasy<YCliente>('/customer/commerce', {
    method: 'POST',
    auth: true,
    body: { name, lastname, email: '', phone: e164, password: '', createdBy: userUuid(sede), createdByCommerce: true },
  })
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/clientes.ts tests-unit/clientes.test.ts
git commit -m "Add customer lookup by phone and creation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Crear reserva (`POST /api/reservas`)

**Files:**
- Create: `api/_lib/reservas.ts`, `api/reservas/index.ts`
- Test: `tests-unit/reservas.test.ts`

**Interfaces:**
- Consumes:
  - `buscarServicio` (Task 4); `disponibilidad`, `empleadosDeSede`, `aHuecosPublicos` (Task 5); `buscarClientePorTelefono`, `crearCliente` (Task 6).
  - `aE164` (Task 2); `normalizarNombre`, `nombreValido` (Task 2); `esFechaReservable`, `semanaIso` (Task 1); `sedePorId` (Task 3).
  - Decisión `MODO_CITA` (Task 0).
- Produces:
  - `interface DatosReserva { sede: SedeYeasy; servicioId: string; fecha: string; hora: string; barbero: string; nombre: string; telefono: string }`.
  - `validarPeticion(body: unknown, ahora: Date): DatosReserva | 'trampa'`, `crearReserva(d: DatosReserva, ahora: Date): Promise<CitaConfirmada>`.
  - `export async function POST(request: Request): Promise<Response>` en `api/reservas/index.ts`.

- [ ] **Step 1: Escribir el test (fallará)**

`tests-unit/reservas.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearReserva, validarPeticion } from '../api/_lib/reservas'
import { POST } from '../api/reservas/index'
import { fetchFalso, type Manejador } from './helpers/fetch-falso'
import { AHORA, CARLOS, DISPONIBILIDAD_Y, EMPLEADOS_Y, SERVICIOS_Y, SVC_CORTE, SVC_EXTRA, WUILL } from './helpers/datos'

const CLIENTES = [
  { uuid: 'c-1', name: 'Luis', lastname: 'Pérez', phone: '+3461-234-5678', isBlocked: false },
  { uuid: 'c-bloq', name: 'X', phone: '+34699999999', isBlocked: true },
]

function rutas(extra: Record<string, Manejador> = {}) {
  return fetchFalso({
    'GET /services/clientweb': () => SERVICIOS_Y,
    'POST /availability': () => DISPONIBILIDAD_Y,
    'GET /employee/commerce/.+': () => EMPLEADOS_Y,
    'POST /availability/employee': () => true,
    'POST /booking/limit': () => [],
    'GET /customer/commerceAndCreatedBynewV2/.+': () => CLIENTES,
    'POST /customer/commerce': () => ({ uuid: 'c-nuevo', name: 'Álvaro', lastname: 'Martín' }),
    'GET /booking/findBookingsByCommerce/.+': () => [],
    'POST /booking': () => ({ uuid: 'cita-1' }),
    'POST /booking/commerce': () => ({ uuid: 'cita-1' }),
    'POST /push-notification/create-booking': () => ({}),
    ...extra,
  })
}

const peticion = (cambios: Record<string, unknown> = {}) => ({
  sede: 'guzman-el-bueno', servicio: SVC_CORTE.uuid, fecha: '2026-10-01', hora: '17:30', barbero: 'any',
  nombre: 'luis PÉREZ', prefijo: '+34', telefono: '612 345 678', website: '', ...cambios,
})

beforeEach(() => {
  vi.stubEnv('YEASY_API_TOKEN', 't')
  vi.stubEnv('YEASY_USER_UUID_GUZMAN', 'u-g')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('validarPeticion', () => {
  it('normaliza nombre y teléfono', () => {
    const d = validarPeticion(peticion(), AHORA)
    expect(d).toMatchObject({ nombre: 'Luis Pérez', telefono: '+34612345678', fecha: '2026-10-01', hora: '17:30', barbero: 'any' })
  })

  it('el campo trampa relleno se ignora en silencio', () => {
    expect(validarPeticion(peticion({ website: 'http://spam' }), AHORA)).toBe('trampa')
  })

  it('reúne todos los campos inválidos', () => {
    expect(() => validarPeticion(peticion({ sede: 'x', fecha: '2026-10-09', hora: '5pm', nombre: 'Luis', telefono: '123', barbero: 'pepe' }), AHORA))
      .toThrow(expect.objectContaining({ codigo: 'DATOS_INVALIDOS', status: 422, campos: ['sede', 'fecha', 'hora', 'barbero', 'nombre', 'telefono'] }))
    expect(() => validarPeticion({ sede: 1 }, AHORA)).toThrow(expect.objectContaining({ status: 422 }))
  })
})

describe('crearReserva', () => {
  const datos = (cambios: Record<string, unknown> = {}) => validarPeticion(peticion(cambios), AHORA) as Exclude<ReturnType<typeof validarPeticion>, 'trampa'>

  it('cliente existente + "cualquiera": revalida y crea la cita con el primer barber libre', async () => {
    const llamadas = rutas()
    const cita = await crearReserva(datos(), AHORA)
    expect(cita).toEqual({ sede: 'guzman-el-bueno', servicio: 'Corte y degradado a máquina', precio: 16, desde: false, fecha: '2026-10-01', hora: '17:30', duracion: 30, barbero: 'Wuilliams' })
    expect(llamadas.some(l => l.ruta === '/customer/commerce')).toBe(false)
    expect(llamadas.find(l => l.ruta === '/availability/employee')!.cuerpo).toMatchObject({ date: '2026-10-01', hour: 17, minute: 30, employee: WUILL })
    const creada = llamadas.find(l => l.ruta === '/booking' || l.ruta === '/booking/commerce')!
    expect(creada.cuerpo).toMatchObject({ startsDay: '2026-10-01', startsHour: 17, startsMinute: 30, duration: 30, week: 40, year: 2026, asignedTo: WUILL })
  })

  it('cliente nuevo: lo crea con el nombre normalizado', async () => {
    const llamadas = rutas()
    await crearReserva(datos({ nombre: 'álvaro martín', telefono: '611111111' }), AHORA)
    expect(llamadas.find(l => l.ruta === '/customer/commerce')!.cuerpo).toMatchObject({ name: 'Álvaro', lastname: 'Martín', phone: '+34611111111' })
  })

  it('barber concreto', async () => {
    const llamadas = rutas()
    const cita = await crearReserva(datos({ barbero: CARLOS }), AHORA)
    expect(cita.barbero).toBe('Carlos')
    expect(llamadas.find(l => l.ruta === '/availability/employee')!.cuerpo).toMatchObject({ employee: CARLOS })
  })

  it('cliente bloqueado → NO_DISPONIBLE y no se crea nada', async () => {
    const llamadas = rutas()
    await expect(crearReserva(datos({ telefono: '699999999' }), AHORA)).rejects.toMatchObject({ codigo: 'NO_DISPONIBLE', status: 409 })
    expect(llamadas.some(l => l.metodo === 'POST' && l.ruta.startsWith('/booking'))).toBe(false)
  })

  it('hora que no está libre, o barber que no está libre a esa hora → HUECO_OCUPADO', async () => {
    rutas()
    await expect(crearReserva(datos({ hora: '12:00' }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
    await expect(crearReserva(datos({ hora: '20:30', barbero: CARLOS }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
  })

  it('Yeasy dice que ya no está libre → HUECO_OCUPADO sin crear cliente', async () => {
    const llamadas = rutas({ 'POST /availability/employee': () => false })
    await expect(crearReserva(datos({ telefono: '611111111' }), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
    expect(llamadas.some(l => l.ruta === '/customer/commerce')).toBe(false)
  })

  it('solapamiento en /booking/limit → HUECO_OCUPADO', async () => {
    rutas({ 'POST /booking/limit': () => [{ uuid: 'otra' }] })
    await expect(crearReserva(datos(), AHORA)).rejects.toMatchObject({ codigo: 'HUECO_OCUPADO' })
  })

  it('duplicado: si ya tiene esa cita la devuelve sin crear otra ni revalidar', async () => {
    const llamadas = rutas({
      'GET /booking/findBookingsByCommerce/.+': () => [{ uuid: 'ya', startsDay: '2026-10-01', startsHour: 17, startsMinute: 30, isDeleted: false, asignedTo: { name: 'Carlos' } }],
    })
    const cita = await crearReserva(datos(), AHORA)
    expect(cita.barbero).toBe('Carlos')
    expect(llamadas.some(l => l.ruta === '/availability')).toBe(false)
    expect(llamadas.some(l => l.metodo === 'POST' && (l.ruta === '/booking' || l.ruta === '/booking/commerce'))).toBe(false)
  })

  it('token caducado al crear la cita → AGENDA_NO_DISPONIBLE', async () => {
    rutas({ 'POST /booking': () => new Response('', { status: 401 }), 'POST /booking/commerce': () => new Response('', { status: 401 }) })
    await expect(crearReserva(datos(), AHORA)).rejects.toMatchObject({ codigo: 'AGENDA_NO_DISPONIBLE', status: 503 })
  })

  it('no deja reservar un extra', async () => {
    rutas()
    await expect(crearReserva(datos({ servicio: SVC_EXTRA.uuid }), AHORA)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS', campos: ['servicio'] })
  })
})

describe('POST /api/reservas', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(AHORA) })
  afterEach(() => { vi.useRealTimers() })

  const req = (body: unknown) => new Request('http://x/api/reservas', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })

  it('201 con la cita', async () => {
    rutas()
    const r = await POST(req(peticion()))
    expect(r.status).toBe(201)
    expect((await r.json()).cita.hora).toBe('17:30')
  })

  it('JSON roto → 422', async () => {
    const r = await POST(req('{no json'))
    expect(r.status).toBe(422)
  })

  it('409 HUECO_OCUPADO se propaga', async () => {
    rutas({ 'POST /availability/employee': () => false })
    const r = await POST(req(peticion()))
    expect(r.status).toBe(409)
    expect(await r.json()).toEqual({ error: 'HUECO_OCUPADO' })
  })

  it('el log no incluye el teléfono completo ni el nombre', async () => {
    rutas()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await POST(req(peticion()))
    const texto = info.mock.calls.flat().join(' ')
    expect(texto).not.toContain('612345678')
    expect(texto).not.toContain('Luis')
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `npm test -- reservas`
Expected: FAIL, "Failed to resolve import ../api/_lib/reservas".

- [ ] **Step 3: Implementar `api/_lib/reservas.ts`**

Pon `MODO_CITA` al valor que decidió la Task 0 (§13 de la spec).

```ts
import { z } from 'zod'
import { buscarClientePorTelefono, crearCliente } from './clientes'
import { ErrorReserva } from './errores'
import { esFechaReservable, semanaIso } from './fecha'
import { aHuecosPublicos, disponibilidad, empleadosDeSede } from './huecos'
import { nombreValido, normalizarNombre } from './nombres'
import { sedePorId, type SedeYeasy } from './sedes'
import { aServiciosPublicos, buscarServicio } from './servicios'
import { aE164 } from './telefono'
import type { CitaConfirmada } from './tipos'
import { yeasy, type YCita, type YCliente, type YServicio } from './yeasy'

/** Decidido en la Tarea 0: 'cliente' = POST /booking como la web de Yeasy; 'comercio' = POST /booking/commerce como el MCP. */
export const MODO_CITA: 'cliente' | 'comercio' = 'cliente'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface DatosReserva {
  sede: SedeYeasy
  servicioId: string
  fecha: string
  hora: string
  barbero: string
  nombre: string
  telefono: string
}

const Esquema = z.object({
  sede: z.string(), servicio: z.string(), fecha: z.string(), hora: z.string(), barbero: z.string(),
  nombre: z.string(), prefijo: z.string(), telefono: z.string(), website: z.string().optional(),
})

export function validarPeticion(body: unknown, ahora: Date): DatosReserva | 'trampa' {
  const r = Esquema.safeParse(body)
  if (!r.success) {
    throw new ErrorReserva('DATOS_INVALIDOS', 422, [...new Set(r.error.issues.map(i => String(i.path[0] ?? 'body')))])
  }
  const p = r.data
  if (p.website) return 'trampa'

  const sede = sedePorId(p.sede)
  const nombre = normalizarNombre(p.nombre)
  const telefono = aE164(p.prefijo, p.telefono)
  const campos: string[] = []
  if (!sede) campos.push('sede')
  if (!UUID.test(p.servicio)) campos.push('servicio')
  if (!esFechaReservable(p.fecha, ahora)) campos.push('fecha')
  if (!/^\d{1,2}:\d{2}$/.test(p.hora)) campos.push('hora')
  if (p.barbero !== 'any' && !UUID.test(p.barbero)) campos.push('barbero')
  if (!nombreValido(nombre)) campos.push('nombre')
  if (!telefono) campos.push('telefono')
  if (campos.length || !sede || !telefono) throw new ErrorReserva('DATOS_INVALIDOS', 422, campos)

  return { sede, servicioId: p.servicio, fecha: p.fecha, hora: p.hora, barbero: p.barbero, nombre, telefono }
}

function aCita(d: DatosReserva, servicio: YServicio, barbero: string): CitaConfirmada {
  const publico = aServiciosPublicos([servicio])[0]
  return {
    sede: d.sede.id, servicio: publico.nombre, precio: publico.precio, desde: publico.desde,
    fecha: d.fecha, hora: d.hora, duracion: servicio.defaultDuration, barbero,
  }
}

async function citaPrevia(commerceUuid: string, clienteUuid: string, fecha: string, hour: number, minute: number): Promise<YCita | null> {
  const citas = await yeasy<YCita[]>(`/booking/findBookingsByCommerce/${commerceUuid}/customer/${clienteUuid}`, { auth: true })
  return (Array.isArray(citas) ? citas : [])
    .find(c => !c.isDeleted && c.startsDay === fecha && c.startsHour === hour && c.startsMinute === minute) ?? null
}

function cuerpoCitaCliente(d: DatosReserva, servicio: YServicio, cliente: YCliente, barberoId: string, hour: number, minute: number) {
  const { week, year } = semanaIso(d.fecha)
  return {
    commerce: d.sede.commerceUuid, customer: cliente.uuid, week, year, commerceSettedUuid: d.sede.commerceUuid,
    startsDay: d.fecha, startsHour: hour, startsMinute: minute, chargeId: null, subsCode: '', inasistanceValue: 0,
    paymentMethod: null, paymentSettedUuid: '', duration: servicio.defaultDuration, message: '',
    asignedTo: barberoId, service: [servicio], status: 'Pendiente', createdBy: '', createdUUID: cliente.uuid,
    createdByType: 'customer', isDeleted: false, customerSelected: d.barbero !== 'any', source: 'web',
  }
}

function cuerpoCitaComercio(d: DatosReserva, servicio: YServicio, cliente: YCliente, barberoId: string, hour: number, minute: number) {
  const { week, year } = semanaIso(d.fecha)
  return {
    commerce: d.sede.commerceUuid, commerceSettedUuid: d.sede.commerceUuid,
    customer: { uuid: cliente.uuid, name: cliente.name, lastname: cliente.lastname ?? '', phone: cliente.phone ?? '', email: cliente.email ?? '' },
    service: [servicio], asignedTo: barberoId, year, week, startsDay: d.fecha, startsHour: hour, startsMinute: minute,
    duration: servicio.defaultDuration, message: '', note: 'Reserva desde la web', status: 'Pendiente', createdByType: 'employee',
  }
}

export async function crearReserva(d: DatosReserva, ahora: Date): Promise<CitaConfirmada> {
  const commerce = d.sede.commerceUuid
  const [hour, minute] = d.hora.split(':').map(Number)
  const servicio = await buscarServicio(commerce, d.servicioId)

  const existente = await buscarClientePorTelefono(commerce, d.telefono)
  if (existente?.isBlocked) throw new ErrorReserva('NO_DISPONIBLE', 409)
  if (existente) {
    const previa = await citaPrevia(commerce, existente.uuid, d.fecha, hour, minute)
    if (previa) return aCita(d, servicio, previa.asignedTo?.name?.trim() ?? '')
  }

  const [disp, empleados] = await Promise.all([disponibilidad(commerce, d.fecha, servicio), empleadosDeSede(commerce)])
  const { huecos, barberos } = aHuecosPublicos(d.fecha, disp, empleados, ahora)
  const hueco = huecos.find(h => h.hora === d.hora)
  const barberoId = d.barbero === 'any' ? hueco?.barberos[0] : hueco?.barberos.find(id => id === d.barbero)
  if (!hueco || !barberoId) throw new ErrorReserva('HUECO_OCUPADO', 409)

  const libre = await yeasy<boolean>('/availability/employee', {
    method: 'POST', auth: true,
    body: { date: d.fecha, hour, minute, employee: barberoId, servicesDuration: servicio.defaultDuration, serviceCollection: [servicio], userTimezone: 'Europe/Madrid' },
  })
  const conflictos = await yeasy<unknown[]>('/booking/limit', {
    method: 'POST', auth: true,
    body: { duration: servicio.defaultDuration, hour, minute, date: d.fecha, employee: { uuid: barberoId }, commerce: { uuid: commerce } },
  })
  if (libre !== true || (Array.isArray(conflictos) && conflictos.length > 0)) throw new ErrorReserva('HUECO_OCUPADO', 409)

  const cliente = existente ?? await crearCliente(d.sede, d.nombre, d.telefono)

  if (MODO_CITA === 'cliente') {
    await yeasy('/booking', { method: 'POST', auth: true, body: cuerpoCitaCliente(d, servicio, cliente, barberoId, hour, minute) })
  } else {
    const creada = await yeasy('/booking/commerce', { method: 'POST', auth: true, body: cuerpoCitaComercio(d, servicio, cliente, barberoId, hour, minute) })
    try {
      await yeasy('/push-notification/create-booking', { method: 'POST', auth: true, body: [creada] })
    } catch {
      // La cita ya existe; un fallo de notificación no la deshace.
    }
  }

  const barbero = barberos.find(b => b.id === barberoId)?.nombre ?? ''
  return aCita(d, servicio, barbero)
}
```

- [ ] **Step 4: Implementar `api/reservas/index.ts`**

```ts
import { errorJson, json, manejarError } from '../_lib/http'
import { crearReserva, validarPeticion } from '../_lib/reservas'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorJson('DATOS_INVALIDOS', 422, ['body'])
  }
  try {
    const ahora = new Date()
    const datos = validarPeticion(body, ahora)
    if (datos === 'trampa') return json({ cita: null }, 201)
    const cita = await crearReserva(datos, ahora)
    console.info('[reservas] cita creada', datos.sede.id, datos.fecha, datos.hora, `tel …${datos.telefono.slice(-3)}`)
    return json({ cita }, 201)
  } catch (e) {
    return manejarError(e)
  }
}
```

- [ ] **Step 5: Ejecutar tests**

Run: `npm test && npm run typecheck:api`
Expected: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/reservas.ts api/reservas/index.ts tests-unit/reservas.test.ts
git commit -m "Add booking endpoint with revalidation, customer lookup and dedupe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Lógica de cliente (API, formato, estado, validación)

**Files:**
- Modify: `app/src/lib/brand.ts`
- Create: `app/src/lib/booking-api.ts`, `app/src/lib/booking-validation.ts`, `app/src/components/booking/estado.ts`, `app/src/components/booking/formato.ts`, `app/src/components/booking/useCarga.ts`
- Test: `tests-unit/cliente-estado.test.ts`, `tests-unit/cliente-formato.test.ts`

**Interfaces:**
- Consumes: tipos de `api/_lib/tipos.ts` (Task 1), `rangoReservable` (Task 1).
- Produces:
  - `brand.ts`: `type SedeId` (reexportado), `Location.id: SedeId`, `BOOKING_MODE: 'integrada' | 'yeasy'`.
  - `booking-api.ts`: `class ErrorApi(codigo: CodigoError, campos?: string[])`, `api.servicios(sede)`, `api.huecos(sede, servicio, fecha)`, `api.reservar(p)`, y reexporta los tipos.
  - `booking-validation.ts`: `PREFIJOS: { code: string; label: string }[]`, `telefonoValido(prefijo, numero): boolean`, `nombreValido(nombre): boolean`.
  - `estado.ts`: `Paso`, `HuecoElegido`, `EstadoReserva`, `estadoInicial`, `Accion`, `reducir(e, a)`.
  - `formato.ts`: `partesFecha(fecha): { dow; num; diaSemana; largo; corto; domingo }`, `capitalizar(s)`, `euros(precio, desde)`.
  - `useCarga.ts`: `type Carga<T>`, `useCarga<T>(clave, cargar): [Carga<T>, () => void]`, `limpiarCache()`.

- [ ] **Step 1: `brand.ts`**

En `app/src/lib/brand.ts`:
- Añade al principio `import type { SedeId } from '../../../api/_lib/tipos'` y `export type { SedeId }`.
- Cambia `id: string` por `id: SedeId` en `interface Location`.
- Añade debajo de `CAMPAIGN_ACTIVE`:

```ts
// Reserva dentro de la web ('integrada') o enlaces a Yeasy como antes ('yeasy').
// Si algo falla en producción, poner 'yeasy' y desplegar: vuelve el comportamiento anterior.
export const BOOKING_MODE: 'integrada' | 'yeasy' = 'integrada'
```

- [ ] **Step 2: Escribir los tests (fallarán)**

`tests-unit/cliente-formato.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { capitalizar, euros, partesFecha } from '@/components/booking/formato'
import { nombreValido, telefonoValido } from '@/lib/booking-validation'

describe('formato', () => {
  it('fechas en español sin depender de Intl', () => {
    expect(partesFecha('2026-09-30')).toEqual({ dow: 'mié', num: '30', diaSemana: 'miércoles', largo: 'miércoles 30 de septiembre', corto: 'mié 30 sep', domingo: false })
    expect(partesFecha('2026-10-04').domingo).toBe(true)
    expect(capitalizar('miércoles 30')).toBe('Miércoles 30')
  })

  it('euros', () => {
    expect(euros(16, false)).toBe('16 €')
    expect(euros(27, true)).toBe('Desde 27 €')
    expect(euros(10.5, false)).toBe('10,50 €')
  })
})

describe('validación en cliente', () => {
  it('teléfono según prefijo', () => {
    expect(telefonoValido('+34', '612 345 678')).toBe(true)
    expect(telefonoValido('+34', '512345678')).toBe(false)
    expect(telefonoValido('+44', '7911123456')).toBe(true)
    expect(telefonoValido('+44', '12')).toBe(false)
  })

  it('nombre con apellido', () => {
    expect(nombreValido('Luis Pérez')).toBe(true)
    expect(nombreValido('  Luis  ')).toBe(false)
  })
})
```

`tests-unit/cliente-estado.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { estadoInicial, reducir, type EstadoReserva } from '@/components/booking/estado'

const servicio = { id: 's1', nombre: 'Corte', precio: 16, desde: false, duracion: 30 }
const abierto = (sedeId?: 'arguelles') => reducir(estadoInicial, { tipo: 'abrir', sedeId, hoy: '2026-10-01' })

describe('reducir', () => {
  it('abrir sin sede empieza en el paso 0; con sede, en el 1', () => {
    expect(abierto()).toMatchObject({ abierto: true, paso: 0, sedeId: null, fecha: '2026-10-01' })
    expect(abierto('arguelles')).toMatchObject({ paso: 1, sedeId: 'arguelles' })
  })

  it('cambiar día o barber borra el hueco elegido', () => {
    let e: EstadoReserva = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    e = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    expect(reducir(e, { tipo: 'elegirFecha', fecha: '2026-10-02' }).hueco).toBeNull()
    expect(reducir(e, { tipo: 'elegirBarbero', barbero: 'b1', nombre: 'Luz' }).hueco).toBeNull()
  })

  it('continuar solo con hueco', () => {
    const e = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    expect(reducir(e, { tipo: 'continuar' }).paso).toBe(2)
    const conHueco = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    expect(reducir(conHueco, { tipo: 'continuar' }).paso).toBe(3)
  })

  it('hueco ocupado vuelve al paso 2 con aviso y conserva nombre y teléfono', () => {
    let e = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    e = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    e = reducir(e, { tipo: 'continuar' })
    e = reducir(e, { tipo: 'dato', campo: 'nombre', valor: 'Luis Pérez' })
    e = reducir(e, { tipo: 'dato', campo: 'telefono', valor: '612345678' })
    e = reducir(e, { tipo: 'huecoOcupado' })
    expect(e).toMatchObject({ paso: 2, hueco: null, avisoHuecoOcupado: true, nombre: 'Luis Pérez', telefono: '612345678' })
  })

  it('cerrar lo reinicia todo', () => {
    expect(reducir(abierto('arguelles'), { tipo: 'cerrar' })).toEqual(estadoInicial)
  })
})
```

- [ ] **Step 3: Ejecutar para ver el fallo**

Run: `npm test -- cliente`
Expected: FAIL, "Failed to resolve import @/components/booking/formato".

- [ ] **Step 4: Implementar `booking-validation.ts`, `formato.ts` y `estado.ts`**

`app/src/lib/booking-validation.ts`:

```ts
export const PREFIJOS = [
  { code: '+34', label: 'ES +34' }, { code: '+351', label: 'PT +351' }, { code: '+33', label: 'FR +33' },
  { code: '+39', label: 'IT +39' }, { code: '+44', label: 'UK +44' }, { code: '+49', label: 'DE +49' },
  { code: '+1', label: 'US +1' }, { code: '+52', label: 'MX +52' }, { code: '+57', label: 'CO +57' },
  { code: '+58', label: 'VE +58' }, { code: '+54', label: 'AR +54' },
]

export function telefonoValido(prefijo: string, numero: string): boolean {
  const limpio = numero.replace(/[\s.\-()]/g, '')
  return prefijo === '+34' ? /^[6789]\d{8}$/.test(limpio) : /^\d{6,12}$/.test(limpio)
}

export function nombreValido(nombre: string): boolean {
  const n = nombre.trim()
  return n.length <= 60 && n.split(/\s+/).filter(Boolean).length >= 2
}
```

`app/src/components/booking/formato.ts`:

```ts
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
```

`app/src/components/booking/estado.ts`:

```ts
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
```

- [ ] **Step 5: Implementar `booking-api.ts` y `useCarga.ts`**

`app/src/lib/booking-api.ts`:

```ts
import type {
  CitaConfirmada, CodigoError, PeticionReserva, RespuestaHuecos, RespuestaServicios,
} from '../../../api/_lib/tipos'

export type {
  BarberoPublico, CitaConfirmada, CodigoError, Franja, HuecoPublico, PeticionReserva,
  RespuestaHuecos, RespuestaServicios, SedeId, ServicioPublico,
} from '../../../api/_lib/tipos'

export class ErrorApi extends Error {
  constructor(public codigo: CodigoError, public campos: string[] = []) {
    super(codigo)
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new ErrorApi('AGENDA_NO_DISPONIBLE')
  }
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) throw new ErrorApi(datos.error ?? 'AGENDA_NO_DISPONIBLE', datos.campos ?? [])
  return datos as T
}

export const api = {
  servicios: (sede: string) =>
    pedir<RespuestaServicios>(`/api/reservas/servicios?${new URLSearchParams({ sede })}`),
  huecos: (sede: string, servicio: string, fecha: string) =>
    pedir<RespuestaHuecos>(`/api/reservas/huecos?${new URLSearchParams({ sede, servicio, fecha })}`),
  reservar: (p: PeticionReserva) =>
    pedir<{ cita: CitaConfirmada }>('/api/reservas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    }),
}
```

`app/src/components/booking/useCarga.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { ErrorApi } from '@/lib/booking-api'

export type Carga<T> = { tipo: 'cargando' } | { tipo: 'error'; error: ErrorApi } | { tipo: 'ok'; datos: T }

// Caché mientras el panel está abierto; BookingProvider la vacía al cerrar.
const cache = new Map<string, unknown>()

export function limpiarCache() {
  cache.clear()
}

export function useCarga<T>(clave: string, cargar: () => Promise<T>): [Carga<T>, () => void] {
  const [intento, setIntento] = useState(0)
  const [carga, setCarga] = useState<Carga<T>>(() =>
    cache.has(clave) ? { tipo: 'ok', datos: cache.get(clave) as T } : { tipo: 'cargando' })

  useEffect(() => {
    if (cache.has(clave)) {
      setCarga({ tipo: 'ok', datos: cache.get(clave) as T })
      return
    }
    let vivo = true
    setCarga({ tipo: 'cargando' })
    cargar()
      .then(datos => {
        cache.set(clave, datos)
        if (vivo) setCarga({ tipo: 'ok', datos })
      })
      .catch(err => {
        if (vivo) setCarga({ tipo: 'error', error: err instanceof ErrorApi ? err : new ErrorApi('AGENDA_NO_DISPONIBLE') })
      })
    return () => { vivo = false }
    // `cargar` cambia en cada render; la clave identifica la petición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  const reintentar = useCallback(() => {
    cache.delete(clave)
    setIntento(i => i + 1)
  }, [clave])

  return [carga, reintentar]
}
```

- [ ] **Step 6: Ejecutar tests y el build de la web**

Run: `npm test && (cd app && npx tsc -b)`
Expected: todos PASS; `tsc` sin errores.

- [ ] **Step 7: Commit**

```bash
git add app/src/lib app/src/components/booking tests-unit/cliente-*.test.ts
git commit -m "Add booking client state, API wrapper and formatting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Panel, selector de sede y CTA conectados

**Files:**
- Create: `app/src/components/booking/piezas.tsx`, `app/src/components/booking/BookingProvider.tsx`, `app/src/components/booking/BookingPanel.tsx`, `app/src/components/booking/StepSede.tsx`, `app/src/components/booking/StepServicio.tsx`
- Create (provisional; `StepHueco` se sustituye en la Task 10 y `StepDatos`/`StepConfirmacion` en la Task 11): `app/src/components/booking/StepHueco.tsx`, `app/src/components/booking/StepDatos.tsx`, `app/src/components/booking/StepConfirmacion.tsx`
- Modify: `app/src/App.tsx`, `app/src/components/Nav.tsx`, `app/src/components/Hero.tsx`, `app/src/components/HeroCampaign.tsx`, `app/src/components/Booking.tsx`, `app/src/components/Contact.tsx`, `app/vite.config.ts`, `playwright.config.ts`
- Delete: `app/src/components/LocationPicker.tsx`
- Create: `tests/mocks/reservas.ts`, `tests/reserva.spec.ts`
- Modify: `tests/la-industria.spec.ts`

**Interfaces:**
- Consumes: todo lo de la Task 8.
- Produces:
  - `useBooking(): { open: (sedeId?: SedeId) => void }` y `BookingProvider`.
  - `data-testid`: `booking-panel`, `picker-<sede>`, `cta-reservar-<sede>`.
  - Piezas: `Cuerpo`, `Pie`, `Etiqueta`, `BotonPrincipal`, `Esqueleto`, `AvisoError`, `Resumen` y la constante `TEXTO_ERROR_CARGA`.
  - Mock e2e `mockReservas(page, opciones?)`, que devuelve el array de cuerpos POST recibidos.

- [ ] **Step 1: Servir la web por HTTP en los e2e y crear el mock**

`fetch('/api/...')` no funciona desde `file://`, así que Playwright pasa a servir la raíz con un servidor estático.

En `playwright.config.ts`:
- Dentro de `use`, sustituye el comentario `// baseURL: 'http://localhost:3000',` por `baseURL: 'http://127.0.0.1:4173',`.
- Sustituye el bloque comentado `webServer` por:

```ts
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
```

- Añade `testMatch: '**/*.spec.ts',` debajo de `testDir: './tests',`.

En `tests/la-industria.spec.ts`:
- Borra las líneas de `FILE_PATH`, `FILE_URL` y el `import path`.
- Sustituye cada `page.goto(FILE_URL)` por `page.goto('/')`.

`tests/mocks/reservas.ts`:

```ts
import type { Page } from '@playwright/test'

export const SERVICIOS = {
  servicios: [
    { id: '5029b0af-bd81-424d-bb85-8043fae859ea', nombre: 'Corte y degradado a máquina', precio: 16, desde: false, duracion: 30 },
    { id: '88a96e08-1721-413d-855d-e8349ffb4d6a', nombre: 'Corte a tijera y barba', precio: 27, desde: true, duracion: 60 },
  ],
}

const CARLOS = { id: 'b-carlos', nombre: 'Carlos', foto: null }
const WUILL = { id: 'b-wuilliams', nombre: 'Wuilliams', foto: null }

/** Wuilliams no trabaja los lunes; los domingos está cerrado. */
export function huecosPara(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay()
  if (dia === 0) return { fecha, barberos: [], huecos: [] }
  if (dia === 1) {
    return { fecha, barberos: [CARLOS], huecos: [
      { hora: '10:00', franja: 'manana', barberos: ['b-carlos'] },
      { hora: '17:30', franja: 'tarde', barberos: ['b-carlos'] },
    ] }
  }
  return { fecha, barberos: [CARLOS, WUILL], huecos: [
    { hora: '10:00', franja: 'manana', barberos: ['b-carlos'] },
    { hora: '17:30', franja: 'tarde', barberos: ['b-carlos', 'b-wuilliams'] },
    { hora: '18:00', franja: 'tarde', barberos: ['b-wuilliams'] },
  ] }
}

export const CITA = {
  sede: 'guzman-el-bueno', servicio: 'Corte y degradado a máquina', precio: 16, desde: false,
  fecha: '2026-10-05', hora: '17:30', duracion: 30, barbero: 'Carlos',
}

type Respuesta = { status: number; json: unknown }

export async function mockReservas(page: Page, opciones: { reservar?: (n: number) => Respuesta } = {}) {
  const cuerpos: Array<Record<string, unknown>> = []
  await page.route('**/api/reservas/servicios**', r => r.fulfill({ json: SERVICIOS }))
  await page.route('**/api/reservas/huecos**', r => {
    const fecha = new URL(r.request().url()).searchParams.get('fecha')!
    return r.fulfill({ json: huecosPara(fecha) })
  })
  await page.route('**/api/reservas', r => {
    cuerpos.push(r.request().postDataJSON())
    const res = opciones.reservar?.(cuerpos.length) ?? { status: 201, json: { cita: CITA } }
    return r.fulfill({ status: res.status, json: res.json })
  })
  return cuerpos
}
```

- [ ] **Step 2: Escribir los e2e de apertura (fallarán)**

`tests/reserva.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { mockReservas } from './mocks/reservas'

test.beforeEach(async ({ page }) => {
  // Jueves 1 de octubre de 2026, 09:00 en Madrid
  await page.clock.setFixedTime(new Date('2026-10-01T07:00:00Z'))
})

test.describe('abrir el flujo', () => {
  test('el Reservar del menú abre el panel en "Elige tu sede" y lleva a servicios', async ({ page }) => {
    await mockReservas(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByRole('navigation').getByRole('button', { name: 'Reservar' }).click()
    const panel = page.getByTestId('booking-panel')
    await expect(panel.getByRole('heading', { name: 'Elige tu sede' })).toBeVisible()
    await panel.getByTestId('picker-arguelles').click()
    await expect(panel.getByRole('heading', { name: 'Elige servicio' })).toBeVisible()
    await expect(panel).toContainText('Reservar · Argüelles')
    await expect(panel.getByRole('button', { name: /Corte a tijera y barba/ })).toContainText('Desde 27 €')
  })

  test('el botón de una sede abre directamente sus servicios', async ({ page }) => {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    const panel = page.getByTestId('booking-panel')
    await expect(panel.getByRole('heading', { name: 'Elige servicio' })).toBeVisible()
    await expect(panel).toContainText('Reservar · Guzmán el Bueno')
  })

  test('cerrar y volver a abrir empieza de cero', async ({ page }) => {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-arguelles').click()
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page.getByTestId('booking-panel')).toBeHidden()
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    await expect(page.getByTestId('booking-panel')).toContainText('Reservar · Guzmán el Bueno')
  })
})
```

En `tests/la-industria.spec.ts` borra los tests `'each location card books on its own Yeasy account'` y `'nav Reservar opens the location picker with both locations'`, que quedan sustituidos por los anteriores.

- [ ] **Step 3: Ejecutar para ver el fallo**

Run: `npx playwright test tests/reserva.spec.ts --project=chromium`
Expected: FAIL. `booking-panel` no existe; el `index.html` servido es el antiguo.

- [ ] **Step 4: Crear las piezas compartidas**

`app/src/components/booking/piezas.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TEXTO_ERROR_CARGA = 'No hemos podido cargar la agenda. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.'
export const TEXTO_ERROR_RESERVA = 'No hemos podido completar la reserva. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.'

export function Cuerpo({ children }: { children: ReactNode }) {
  return <div className="grow overflow-y-auto p-5">{children}</div>
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.4em] text-arena">{children}</span>
}

export function Pie({ nota, children }: { nota?: string; children: ReactNode }) {
  return (
    <div className="shrink-0 flex flex-col gap-2.5 px-5 pt-3.5 pb-6 border-t border-[#4a4948] bg-carbon">
      {nota && <p className="text-center font-work-sans text-xs text-arena">{nota}</p>}
      {children}
    </div>
  )
}

export function BotonPrincipal({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        'min-h-[52px] w-full bg-cream text-carbon hover:bg-cream-bg font-work-sans font-bold text-[13px] uppercase tracking-[0.25em] transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
        className,
      )}
    />
  )
}

export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cn('bg-dark2 animate-pulse', className)} />
}

export function AvisoError({ texto, onReintentar, whatsappUrl }: { texto: string; onReintentar?: () => void; whatsappUrl: string }) {
  return (
    <div role="alert" className="flex flex-col gap-3 p-4 border border-cream/40">
      <p className="font-work-sans text-[13px] leading-relaxed text-cream">{texto}</p>
      <div className="flex flex-wrap items-center gap-5">
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="min-h-11 px-4 bg-cream text-carbon font-work-sans font-bold text-[11px] uppercase tracking-[0.25em]">
            Reintentar
          </button>
        )}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-work-sans text-xs text-cream underline underline-offset-4">
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  )
}

export function Resumen({ filas, children }: { filas: Array<[string, string]>; children?: ReactNode }) {
  return (
    <div className="flex flex-col bg-dark2">
      <dl>
        {filas.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 border-b border-[#4a4948] last:border-b-0">
            <dt className="pt-0.5 font-work-sans font-bold text-[9px] uppercase tracking-[0.25em] text-arena">{k}</dt>
            <dd className="font-work-sans text-[13px] text-right text-cream">{v}</dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Crear el provider, el panel, el paso de sede y marcadores para los demás pasos**

`app/src/components/booking/BookingProvider.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { BOOKING_MODE, LOCATIONS, type SedeId } from '@/lib/brand'
import { rangoReservable } from '../../../../api/_lib/fecha'
import { BookingPanel } from './BookingPanel'
import { estadoInicial, reducir, type Accion } from './estado'
import { limpiarCache } from './useCarga'

interface BookingContextValue { open: (sedeId?: SedeId) => void }

const BookingContext = createContext<BookingContextValue>({ open: () => {} })

/** `open()` pregunta la sede; `open(sedeId)` va directo a sus servicios. */
export function useBooking() {
  return useContext(BookingContext)
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reducir, estadoInicial)

  const dispatch = useCallback((a: Accion) => {
    if (a.tipo === 'cerrar') limpiarCache()
    despachar(a)
  }, [])

  const open = useCallback((sedeId?: SedeId) => {
    const sede = LOCATIONS.find(l => l.id === sedeId)
    if (BOOKING_MODE === 'yeasy' && sede) {
      window.open(sede.bookingUrl, '_blank', 'noopener,noreferrer')
      return
    }
    dispatch({ tipo: 'abrir', sedeId, hoy: rangoReservable(new Date())[0] })
  }, [dispatch])

  const value = useMemo(() => ({ open }), [open])

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingPanel estado={estado} dispatch={dispatch} />
    </BookingContext.Provider>
  )
}
```

`app/src/components/booking/BookingPanel.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, X } from 'lucide-react'
import { LOCATIONS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { Accion, EstadoReserva } from './estado'
import { StepConfirmacion } from './StepConfirmacion'
import { StepDatos } from './StepDatos'
import { StepHueco } from './StepHueco'
import { StepSede } from './StepSede'
import { StepServicio } from './StepServicio'

const TITULOS = ['Elige tu sede', 'Elige servicio', 'Día y hora', 'Tus datos', 'Cita reservada']
const PASOS = ['Servicio', 'Día y hora', 'Tus datos']

const botonIcono = 'w-11 h-11 shrink-0 flex items-center justify-center border border-cream/10 text-arena hover:text-cream transition-colors'

export function BookingPanel({ estado, dispatch }: { estado: EstadoReserva; dispatch: (a: Accion) => void }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const sede = LOCATIONS.find(l => l.id === estado.sedeId)
  const conPasos = estado.paso >= 1 && estado.paso <= 3

  useEffect(() => {
    if (estado.abierto) titulo.current?.focus()
  }, [estado.paso, estado.abierto])

  return (
    <Dialog.Root open={estado.abierto} onOpenChange={abierto => { if (!abierto) dispatch({ tipo: 'cerrar' }) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
        <Dialog.Content
          data-testid="booking-panel"
          aria-describedby={undefined}
          onOpenAutoFocus={e => { e.preventDefault(); titulo.current?.focus() }}
          className="fixed z-50 inset-0 flex flex-col bg-carbon text-cream md:left-auto md:w-[480px] md:border-l md:border-cream/10"
        >
          <header className="shrink-0 flex flex-col gap-3.5 px-5 pt-3 pb-4 border-b border-[#4a4948]">
            <span aria-hidden className="self-center block w-10 h-[3px] bg-gray-stone md:hidden" />
            <div className="flex items-center justify-between gap-2">
              {conPasos ? (
                <button type="button" aria-label="Volver" onClick={() => dispatch({ tipo: 'volver' })} className={botonIcono}>
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
              ) : (
                <span aria-hidden className="w-11 h-11" />
              )}
              <span className="grow text-center font-work-sans font-medium text-[9px] uppercase tracking-[0.4em] text-arena">
                {estado.paso === 0 || !sede ? 'Reservar cita' : `Reservar · ${sede.name}`}
              </span>
              <Dialog.Close aria-label="Cerrar" className={botonIcono}>
                <X size={18} strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            <Dialog.Title
              ref={titulo}
              tabIndex={-1}
              className="font-coolvetica font-normal text-[32px] leading-none uppercase text-cream outline-none"
            >
              {TITULOS[estado.paso]}
            </Dialog.Title>
            {conPasos && (
              <ol className="grid grid-cols-3 gap-1.5" aria-label="Progreso">
                {PASOS.map((p, i) => (
                  <li key={p} className="flex flex-col gap-1.5" aria-current={i + 1 === estado.paso ? 'step' : undefined}>
                    <span className={cn('block h-[3px]', i + 1 <= estado.paso ? 'bg-cream' : 'bg-[#4a4948]')} />
                    <span className={cn(
                      'font-work-sans text-[9px] uppercase tracking-[0.2em]',
                      i + 1 === estado.paso ? 'font-bold text-cream' : 'text-arena',
                    )}>{p}</span>
                  </li>
                ))}
              </ol>
            )}
          </header>

          {estado.paso === 0 && <StepSede dispatch={dispatch} />}
          {estado.paso === 1 && estado.sedeId && <StepServicio sedeId={estado.sedeId} actual={estado.servicio?.id ?? null} dispatch={dispatch} />}
          {estado.paso === 2 && <StepHueco estado={estado} dispatch={dispatch} />}
          {estado.paso === 3 && <StepDatos estado={estado} dispatch={dispatch} />}
          {estado.paso === 4 && <StepConfirmacion estado={estado} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

`app/src/components/booking/StepSede.tsx`:

```tsx
import { ArrowRight } from 'lucide-react'
import { BOOKING_MODE, LOCATIONS, type Location } from '@/lib/brand'
import type { Accion } from './estado'
import { Cuerpo } from './piezas'

export function StepSede({ dispatch }: { dispatch: (a: Accion) => void }) {
  const elegir = (l: Location) => {
    if (BOOKING_MODE === 'yeasy') {
      window.open(l.bookingUrl, '_blank', 'noopener,noreferrer')
      return
    }
    dispatch({ tipo: 'elegirSede', sedeId: l.id })
  }

  return (
    <Cuerpo>
      <div className="flex flex-col gap-2.5">
        <p className="mb-1.5 font-work-sans text-[13px] leading-relaxed text-arena">
          Cada sede lleva su propia agenda. Elige dónde quieres cortarte.
        </p>
        {LOCATIONS.map(l => (
          <button
            key={l.id}
            type="button"
            data-testid={`picker-${l.id}`}
            onClick={() => elegir(l)}
            className="group flex items-center gap-4 px-4 py-5 bg-dark2 border border-cream/10 hover:border-cream/40 text-left transition-colors"
          >
            <span className="grow flex flex-col gap-1.5">
              <span className="flex items-center gap-2.5">
                <span className="font-coolvetica text-xl leading-none uppercase text-cream">{l.name}</span>
                {l.isNew && (
                  <span className="px-2 py-1 bg-cream text-carbon font-work-sans font-bold text-[8px] uppercase tracking-[0.3em]">Nueva</span>
                )}
              </span>
              <span className="font-work-sans text-xs text-arena">{l.shortAddress}</span>
            </span>
            <ArrowRight size={16} strokeWidth={1.5} className="text-cream group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </Cuerpo>
  )
}
```

Añade `export` a `interface Location` en `brand.ts` si aún no lo tiene (ya lo tiene).

Marcadores temporales para que compile; se sustituyen enteros: `StepServicio` en el Step 7 de esta task, `StepHueco` en la Task 10, `StepDatos` y `StepConfirmacion` en la Task 11.

`app/src/components/booking/StepServicio.tsx`, `StepHueco.tsx`, `StepDatos.tsx` y `StepConfirmacion.tsx`, cada uno con este contenido (cambiando el nombre de la función exportada: `StepServicio`, `StepHueco`, `StepDatos`, `StepConfirmacion`):

```tsx
// Provisional: se sustituye entero más adelante (ver el plan).
export function StepServicio(_props: Record<string, unknown>) {
  return null
}
```

- [ ] **Step 6: Conectar los CTA y el proxy de desarrollo**

- `app/src/App.tsx`:
  - Sustituye `import { LocationPickerProvider } from './components/LocationPicker'` por `import { BookingProvider } from './components/booking/BookingProvider'`.
  - Sustituye `<LocationPickerProvider>` / `</LocationPickerProvider>` por `<BookingProvider>` / `</BookingProvider>`.
- `app/src/components/Nav.tsx`:
  - Sustituye `import { useLocationPicker } from './LocationPicker'` por `import { useBooking } from './booking/BookingProvider'`.
  - Sustituye `const openPicker = useLocationPicker()` por `const { open } = useBooking()`.
  - Sustituye los dos `onClick={openPicker}` por `onClick={() => open()}`.
- `app/src/components/Hero.tsx`: el mismo cambio de import y de `openPicker`. `<ShimmerButton onClick={openPicker}>` pasa a `<ShimmerButton onClick={() => open()}>`.
- `app/src/components/HeroCampaign.tsx`:
  - El mismo cambio de import y de `openPicker` (`onClick={() => open()}`).
  - En las tarjetas de sede, sustituye la apertura `<a key={l.id} href={l.bookingUrl} target="_blank" rel="noopener noreferrer" className={cn(` por `<button key={l.id} type="button" onClick={() => open(l.id)} className={cn(`.
  - Añade `'text-left w-full', ` como primer elemento de la lista de `cn(...)`.
  - Cambia su cierre `</a>` por `</button>`.
- `app/src/components/Booking.tsx`:
  - Añade `import { useBooking } from './booking/BookingProvider'`.
  - Dentro de `LocationCard`, añade `const { open } = useBooking()` como primera línea.
  - Sustituye el `<a href={l.bookingUrl} target="_blank" rel="noopener noreferrer" data-testid={`cta-reservar-${l.id}`} className="block text-center ...">Reservar aquí</a>` por:

```tsx
          <button
            type="button"
            onClick={() => open(l.id)}
            data-testid={`cta-reservar-${l.id}`}
            className="block w-full text-center px-6 py-4 bg-cream text-carbon hover:bg-cream-bg font-work-sans font-bold text-[13px] uppercase tracking-[0.25em] transition-colors"
          >
            Reservar aquí
          </button>
```

  - Sustituye `Cada sede tiene su propia agenda · Powered by Yeasy` por `Cada sede tiene su propia agenda`.
- `app/src/components/Contact.tsx`:
  - Añade `import { useBooking } from './booking/BookingProvider'` y `const { open } = useBooking()` dentro de `Contact`.
  - Sustituye `<a href={loc.bookingUrl} target="_blank" rel="noopener noreferrer"><ShimmerButton>Reservar aquí</ShimmerButton></a>` por `<ShimmerButton onClick={() => open(loc.id)}>Reservar aquí</ShimmerButton>`.
- Borra `app/src/components/LocationPicker.tsx`.
- `app/src/components/Services.tsx` también importa `useLocationPicker`. Hasta la Task 11 cambia su import a `import { useBooking } from './booking/BookingProvider'` y `const openPicker = useLocationPicker()` a `const { open } = useBooking()`, y sus `onClick={openPicker}` a `onClick={() => open()}`.
- `app/vite.config.ts`: añade dentro de `defineConfig({ ... })`:

```ts
  server: {
    proxy: { '/api': 'http://localhost:3000' },
    // La web importa api/_lib/fecha.ts y api/_lib/tipos.ts, que están fuera de app/.
    fs: { allow: ['..'] },
  },
```

(`vercel dev` sirve las funciones en `:3000`. El build no necesita `fs.allow`; el servidor de desarrollo sí.)

- [ ] **Step 7: Implementar `StepServicio`**

Sustituye `app/src/components/booking/StepServicio.tsx` por:

```tsx
import { api, type SedeId } from '@/lib/booking-api'
import { LOCATIONS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { Accion } from './estado'
import { euros } from './formato'
import { AvisoError, Cuerpo, Esqueleto, TEXTO_ERROR_CARGA } from './piezas'
import { useCarga } from './useCarga'

export function StepServicio({ sedeId, actual, dispatch }: { sedeId: SedeId; actual: string | null; dispatch: (a: Accion) => void }) {
  const sede = LOCATIONS.find(l => l.id === sedeId)!
  const [carga, reintentar] = useCarga(`servicios:${sedeId}`, () => api.servicios(sedeId))

  return (
    <Cuerpo>
      {carga.tipo === 'cargando' && (
        <div aria-label="Cargando servicios" className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-[72px]" />)}
        </div>
      )}
      {carga.tipo === 'error' && <AvisoError texto={TEXTO_ERROR_CARGA} onReintentar={reintentar} whatsappUrl={sede.whatsappUrl} />}
      {carga.tipo === 'ok' && (
        <ul className="flex flex-col gap-2">
          {carga.datos.servicios.map(s => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => dispatch({ tipo: 'elegirServicio', servicio: s })}
                className={cn(
                  'w-full min-h-16 flex items-center gap-4 px-4 py-3.5 bg-dark2 border text-left transition-colors',
                  s.id === actual ? 'border-cream' : 'border-cream/10 hover:border-cream/40',
                )}
              >
                <span className="grow min-w-0 flex flex-col gap-1">
                  <span className="font-work-sans font-medium text-sm leading-snug text-cream">{s.nombre}</span>
                  <span className="font-work-sans text-[11px] tracking-wide text-arena">{s.duracion} min</span>
                </span>
                <span className="shrink-0 font-coolvetica text-xl leading-none text-cream">{euros(s.precio, s.desde)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Cuerpo>
  )
}
```

- [ ] **Step 8: Compilar la web y ejecutar los e2e**

Run: `(cd app && npm run build) && npx playwright test --project=chromium`
Expected:
- El build genera `index.html` en la raíz.
- `tests/reserva.spec.ts` (3 tests) PASS.
- `tests/la-industria.spec.ts` PASS, incluido `'services section has carbon background'` (Servicios sigue ahí hasta la Task 11).

- [ ] **Step 9: Commit**

```bash
git add -A app/src playwright.config.ts tests index.html app/vite.config.ts
git commit -m "Open an in-site booking panel from every Reservar CTA

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Paso de día, barber y hora

**Files:**
- Modify: `app/src/components/booking/StepHueco.tsx` (sustituir el marcador)
- Test: `tests/reserva.spec.ts` (añadir `describe`)

**Interfaces:**
- Consumes: `useCarga`, `api.huecos`, `partesFecha`, `euros`, `reducir` (Task 8); piezas (Task 9); `rangoReservable` (Task 1).
- Produces: el paso 2 completo. `hueco.barbero` es `'any'` si el cliente eligió "Cualquiera"; si no, el id del barber.

- [ ] **Step 1: Escribir los e2e (fallarán)**

Añade a `tests/reserva.spec.ts`:

```ts
test.describe('día, barber y hora', () => {
  async function hastaHuecos(page: import('@playwright/test').Page) {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    await page.getByRole('button', { name: /Corte y degradado a máquina/ }).click()
    return page.getByTestId('booking-panel')
  }

  test('enseña 7 días, el domingo deshabilitado, y los barbers del día', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await expect(panel.getByRole('heading', { name: 'Día y hora' })).toBeVisible()
    await expect(panel.getByRole('button', { name: /^(Jueves|Viernes|Sábado|Domingo|Lunes|Martes|Miércoles) \d+ de/ })).toHaveCount(7)
    await expect(panel.getByRole('button', { name: 'Domingo 4 de octubre, cerrado' })).toBeDisabled()
    await expect(panel.getByRole('button', { name: 'Cualquiera' })).toHaveAttribute('aria-pressed', 'true')
    await expect(panel.getByRole('button', { name: 'Wuilliams' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  test('filtrar por barber enseña solo sus horas', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await panel.getByRole('button', { name: 'Wuilliams' }).click()
    await expect(panel.getByRole('button', { name: '10:00' })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: '18:00' })).toBeVisible()
  })

  test('si el barber no trabaja el día elegido pasa a "Cualquiera" con aviso', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await panel.getByRole('button', { name: 'Wuilliams' }).click()
    await panel.getByRole('button', { name: 'Lunes 5 de octubre' }).click()
    await expect(panel).toContainText('Wuilliams no trabaja el lunes. Te enseñamos los huecos de todo el equipo.')
    await expect(panel.getByRole('button', { name: 'Cualquiera' })).toHaveAttribute('aria-pressed', 'true')
    await panel.getByRole('button', { name: '17:30' }).click()
    await expect(panel).toContainText('lun 5 oct · 17:30 · con Carlos')
    await expect(panel.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  test('el enlace de WhatsApp para más adelante está a mano', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await expect(panel.getByRole('link', { name: /Escríbenos por WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/34627015904')
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `(cd app && npm run build) && npx playwright test tests/reserva.spec.ts --project=chromium -g "día, barber y hora"`
Expected: FAIL, no aparece el título "Día y hora" porque `StepHueco` devuelve `null`.

- [ ] **Step 3: Implementar `StepHueco.tsx`**

```tsx
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
```

Si `no-scrollbar` no existe como utilidad en `app/src/index.css`, compruébalo con `grep -n no-scrollbar app/src/index.css`. `Booking.tsx` ya la usa, así que debe existir.

- [ ] **Step 4: Compilar y ejecutar los e2e**

Run: `(cd app && npm run build) && npx playwright test tests/reserva.spec.ts --project=chromium`
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/booking/StepHueco.tsx tests/reserva.spec.ts index.html
git commit -m "Add day, barber and time step with per-day barber filtering

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Datos del cliente, confirmación y errores

**Files:**
- Modify: `app/src/components/booking/StepDatos.tsx`, `app/src/components/booking/StepConfirmacion.tsx` (sustituir los marcadores)
- Test: `tests/reserva.spec.ts` (añadir `describe`)

**Interfaces:**
- Consumes: `api.reservar`, `ErrorApi` (Task 8); `PREFIJOS`, `telefonoValido`, `nombreValido` (Task 8); `limpiarCache` (Task 8); piezas (Task 9).
- Produces: los pasos 3 y 4.

- [ ] **Step 1: Escribir los e2e (fallarán)**

Añade a `tests/reserva.spec.ts` (y amplía el import a `import { CITA, mockReservas } from './mocks/reservas'`):

```ts
test.describe('datos y confirmación', () => {
  async function hastaDatos(page: import('@playwright/test').Page, reservar?: (n: number) => { status: number; json: unknown }) {
    const cuerpos = await mockReservas(page, { reservar })
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    const panel = page.getByTestId('booking-panel')
    await panel.getByRole('button', { name: /Corte y degradado a máquina/ }).click()
    await panel.getByRole('button', { name: 'Lunes 5 de octubre' }).click()
    await panel.getByRole('button', { name: '17:30' }).click()
    await panel.getByRole('button', { name: 'Continuar' }).click()
    await expect(panel.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
    return { panel, cuerpos }
  }

  test('valida al enviar y no llama a la API con datos malos', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page)
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel).toContainText('Escribe tu nombre y al menos un apellido.')
    await expect(panel).toContainText('Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9.')
    await panel.getByLabel('Prefijo del país').selectOption('+44')
    await expect(panel).toContainText('Revisa el teléfono: solo cifras, sin el prefijo.')
    expect(cuerpos).toHaveLength(0)
  })

  test('reserva y confirma, mandando lo que el cliente eligió', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page)
    await expect(panel).toContainText('Lunes 5 de octubre')
    await panel.getByLabel('Nombre y apellidos').fill('álvaro martín')
    await panel.getByLabel('Teléfono').fill('612 345 678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Cita reservada' })).toBeVisible()
    await expect(panel).toContainText('Te esperamos en Guzmán el Bueno. Nos vemos en el sillón.')
    await expect(panel).toContainText(CITA.barbero)
    expect(cuerpos[0]).toMatchObject({
      sede: 'guzman-el-bueno', servicio: '5029b0af-bd81-424d-bb85-8043fae859ea', fecha: '2026-10-05', hora: '17:30',
      barbero: 'any', nombre: 'álvaro martín', prefijo: '+34', telefono: '612 345 678', website: '',
    })
    await expect(panel.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute('href', 'https://maps.app.goo.gl/DWMwgH6QEkesm1Rp8')
  })

  test('hueco ocupado: vuelve a las horas con aviso y conserva los datos', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page, n => n === 1
      ? { status: 409, json: { error: 'HUECO_OCUPADO' } }
      : { status: 201, json: { cita: CITA } })
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Día y hora' })).toBeVisible()
    await expect(panel.getByRole('alert')).toContainText('Esa hora ya no está disponible')
    await panel.getByRole('button', { name: '10:00' }).click()
    await panel.getByRole('button', { name: 'Continuar' }).click()
    await expect(panel.getByLabel('Nombre y apellidos')).toHaveValue('Álvaro Martín')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Cita reservada' })).toBeVisible()
    expect(cuerpos).toHaveLength(2)
  })

  test('agenda caída: mensaje claro y se queda en el paso', async ({ page }) => {
    const { panel } = await hastaDatos(page, () => ({ status: 503, json: { error: 'AGENDA_NO_DISPONIBLE' } }))
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('alert')).toContainText('No hemos podido completar la reserva.')
    await expect(panel.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  })

  test('el servidor rechaza el teléfono: se marca el campo', async ({ page }) => {
    const { panel } = await hastaDatos(page, () => ({ status: 422, json: { error: 'DATOS_INVALIDOS', campos: ['telefono'] } }))
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel).toContainText('Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9.')
  })
})
```

- [ ] **Step 2: Ejecutar para ver el fallo**

Run: `(cd app && npm run build) && npx playwright test tests/reserva.spec.ts --project=chromium -g "datos y confirmación"`
Expected: FAIL, no aparece el título "Tus datos".

- [ ] **Step 3: Implementar `StepDatos.tsx`**

```tsx
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
```

- [ ] **Step 4: Implementar `StepConfirmacion.tsx`**

```tsx
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
```

- [ ] **Step 5: Compilar y ejecutar todos los tests**

Run: `(cd app && npm run build) && npm test && npx playwright test --project=chromium`
Expected: vitest y Playwright en verde (12 tests de reserva + los existentes).

- [ ] **Step 6: Commit**

```bash
git add app/src/components/booking/StepDatos.tsx app/src/components/booking/StepConfirmacion.tsx tests/reserva.spec.ts index.html
git commit -m "Add customer details, confirmation and booking error handling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Quitar Servicios, colores, CI y documentación

**Files:**
- Delete: `app/src/components/Services.tsx`
- Modify: `app/src/App.tsx`, `app/src/components/Nav.tsx`, `app/src/components/Hero.tsx`, `app/src/components/HeroCampaign.tsx`, `vercel.json`, `.github/workflows/playwright.yml`, `CLAUDE.md`, `tests/la-industria.spec.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: la web final, la CI con tests unitarios y la documentación al día.

- [ ] **Step 1: Cambiar los tests de la página (fallarán)**

En `tests/la-industria.spec.ts` sustituye el test `'services section has carbon background'` por:

```ts
  test('services section is gone and nothing links to it', async ({ page }) => {
    await expect(page.locator('#servicios')).toHaveCount(0)
    await expect(page.locator('a[href="#servicios"]')).toHaveCount(0)
  })

  test('hero has carbon background so it contrasts with the team section', async ({ page }) => {
    const hero = await page.locator('#hero').evaluate(el => getComputedStyle(el).backgroundColor)
    const equipo = await page.locator('#equipo').evaluate(el => getComputedStyle(el).backgroundColor)
    expect(hero).toContain('65, 64, 64') // #414040
    expect(equipo).toContain('51, 50, 49') // #333231
  })
```

Run: `npx playwright test tests/la-industria.spec.ts --project=chromium`
Expected: FAIL en los dos tests nuevos.

- [ ] **Step 2: Quitar Servicios y ajustar colores**

- `app/src/App.tsx`: borra `import { Services } from './components/Services'` y `<Services />`.
- Borra `app/src/components/Services.tsx`.
- `app/src/components/Nav.tsx`: borra `{ label: 'Servicios', href: '#servicios' },` de `links`.
- `app/src/components/Hero.tsx`:
  - En `HeroClassic`, `bg-dark2` → `bg-carbon` en la `className` de la `section`.
  - Sustituye el enlace `href="#servicios"` con texto `Ver servicios` por `href="#reservas"` con texto `Ver sedes`.
- `app/src/components/HeroCampaign.tsx`:
  - `bg-dark2` → `bg-carbon` en la `className` de la `section`.
  - En las tarjetas de sede, `'bg-carbon text-cream border-cream/10 hover:border-cream/40'` → `'bg-dark2 text-cream border-cream/10 hover:border-cream/40'`.
- Comprueba que no queda nada: `grep -rn "servicios\|LocationPicker\|useLocationPicker" app/src` no debe devolver nada salvo `booking-api.ts` y los `booking/*` que usan `api.servicios`.

- [ ] **Step 3: `vercel.json`**

- Sustituye `"installCommand": "echo 'dependencies installed in buildCommand'",` por `"installCommand": "npm install",`. Las funciones necesitan `zod` y `libphonenumber-js` del `package.json` de la raíz.
- Añade al mismo nivel que `headers`:

```json
  "redirects": [
    { "source": "/api/_lib/:path*", "destination": "/", "permanent": false }
  ],
```

(El directorio de salida es la raíz, así que evitamos servir el código de `api/_lib` como estático.)

- [ ] **Step 4: CI**

En `.github/workflows/playwright.yml`, tras `- name: Install dependencies` / `run: npm ci`, añade:

```yaml
    - name: Type-check API
      run: npm run typecheck:api
    - name: Unit tests
      run: npm test
```

- [ ] **Step 5: `CLAUDE.md`**

- En "Commands", tras el bloque de Playwright, añade:

````markdown
Unit tests (server logic + booking client logic) and API type-check run from the root:

```bash
npm test                 # vitest (tests-unit/)
npm run typecheck:api    # tsc over api/
vercel dev               # web + /api functions together on :3000 (Vite dev proxies /api there)
```
````

- En "Source layout":
  - Sustituye la línea de `App.tsx` por: "`App.tsx` — Composes Nav → Hero → Team → Booking → Contact inside `BookingProvider`. There is no Services section: services and prices live inside the booking flow."
  - Sustituye la línea de `LocationPicker.tsx` por: "`components/booking/` — In-site booking flow (Radix Dialog panel: sede → servicio → día/barber/hora → datos → confirmación). Any "Reservar" CTA calls `useBooking().open(sedeId?)`. State in `estado.ts` (reducer); API calls in `lib/booking-api.ts`. `BOOKING_MODE` in `lib/brand.ts` switches back to plain Yeasy links (`'yeasy'`) as a kill switch."
- Añade una sección nueva tras "Source layout":

```markdown
### Booking API (`api/`, repo root)

Vercel Functions, the only door to `api.yeasy.io`. `api/_lib/` is shared code (not routed).

| Endpoint | Does |
|---|---|
| `GET /api/reservas/servicios?sede=` | Public services before the "Extras" separator, clean names (map in `_lib/servicios.ts`) |
| `GET /api/reservas/huecos?sede=&servicio=&fecha=` | Slots for one day via `POST /availability` (never `/availability/v2`, which jumps to the next open day). Only barbers with slots that day, no admin staff |
| `POST /api/reservas` | Validates, re-checks the slot, finds the customer by phone (digits only) or creates it, avoids duplicates, creates the booking |

Env vars (Vercel, Preview + Production): `YEASY_API_TOKEN` (admin JWT, ~700 days — renewal steps in `contabilidad-la-industria/yeasy-mcp-server/README.md`), `YEASY_USER_UUID_GUZMAN`, `YEASY_USER_UUID_ARGUELLES`. `scripts/yeasy-sonda.mjs` re-checks the Yeasy contracts.
```

- En la tabla "Section background colors": Hero pasa a `carbon`, se borra la fila Services y queda Team `dark2`, Booking `carbon`, Contact `dark2`, Footer `carbon`.
- En "Testing":
  - Sustituye la primera frase por: "Playwright tests in `tests/` run against the built `index.html` served on `127.0.0.1:4173` (python http.server) with `/api/reservas/*` mocked (`tests/mocks/reservas.ts`); they cover the page and the full booking flow. Vitest covers `api/_lib` and the booking client logic."
  - Luego rehaz el `index.html` antes de los e2e (`cd app && npm run build`).

- [ ] **Step 6: Compilar y ejecutar todo**

Run: `(cd app && npm run build) && npm run typecheck:api && npm test && npx playwright test`
Expected: todo en verde en chromium, firefox y webkit.

- [ ] **Step 7: Revisión visual**

Arranca la web con el servidor estático y los mocks no disponibles: `python3 -m http.server 4173`. Ábrela con `preview_start` a `http://127.0.0.1:4173`. Comprueba:
- Hero en `carbon` y Equipo en `dark2`.
- No aparece "Servicios" en el menú.
- Los botones "Reservar" abren el panel.

Compara el panel en móvil (390×844) y escritorio con el diseño aprobado. Sin `/api` real, el paso de servicios mostrará el error de carga, y eso es lo esperado aquí.

- [ ] **Step 8: Commit**

```bash
git add -A app/src vercel.json .github/workflows/playwright.yml CLAUDE.md tests index.html screenshots
git commit -m "Remove Services section, rebalance section colors, add unit tests to CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Despliegue en preview, prueba real y paso a producción

Toca servicios externos: **cada paso de este bloque se confirma con Jaime en el chat antes de hacerlo.**

**Files:** ninguno (configuración en Vercel).

- [ ] **Step 1: Variables de entorno en Vercel (Preview y Production)**

Tras confirmarlo con Jaime, carga la variable desde el `.env` del MCP **sin imprimir sus valores**:

```bash
ENV=../contabilidad-la-industria/yeasy-mcp-server/.env
for destino in preview production; do
  grep '^YEASY_API_TOKEN=' "$ENV" | cut -d= -f2- | tr -d '\n' | vercel env add YEASY_API_TOKEN "$destino" --sensitive
done
```

Comprueba con `vercel env ls` que aparece en Preview y Production.

- [ ] **Step 2: Límite de peticiones en el Vercel Firewall**

En el proyecto, Firewall → Custom rules (o la herramienta `put_firewall_config` del MCP de Vercel), crea dos reglas de tipo *Rate limit* por IP:
- `POST` con path igual a `/api/reservas`: 5 peticiones / 10 min → responder 429.
- Path que empiece por `/api/reservas/`: 60 peticiones / 60 s → responder 429.

- [ ] **Step 3: Desplegar la rama en preview y revisar**

Run: `git push -u origin feat/reserva-integrada`. Vercel crea el preview. Comprueba:
- `curl -s -o /dev/null -w '%{http_code}' <preview>/api/_lib/yeasy.ts` → `307`/`308`, que redirige, **no** `200`.
- `curl -s '<preview>/api/reservas/servicios?sede=arguelles' | head -c 300` → servicios con nombres limpios.
- `curl -s '<preview>/api/reservas/huecos?sede=guzman-el-bueno&servicio=5029b0af-bd81-424d-bb85-8043fae859ea&fecha=<mañana>'` → barbers sin Admin ni Sanmil.

Abre el preview en móvil y escritorio y recorre el flujo hasta el paso "Tus datos" sin enviar.

- [ ] **Step 4: Reserva real de prueba con Jaime**

Pide permiso y un hueco que él elija. Haz una reserva real desde el preview con los datos de prueba que él indique. Comprueba con él en la app de Yeasy:
- que la cita está en la sede, la hora y con el barber correctos;
- que el cliente es el correcto (nuevo o existente, sin duplicar);
- cómo aparece el origen.

Después, él la borra desde Yeasy o la borras tú con `DELETE /booking/no-notification/<uuid>` si te lo pide.

- [ ] **Step 5: Abrir PR y pasar a producción**

Con el visto bueno de Jaime, abre el PR hacia `main` (cuerpo terminado en `🤖 Generated with [Claude Code](https://claude.com/claude-code)`). Enlázalo con las herramientas ccd_pr y, cuando la CI esté en verde y él lo apruebe, haz merge.

**Vuelta atrás:** si hay problemas en producción, `BOOKING_MODE = 'yeasy'` en `app/src/lib/brand.ts`, `cd app && npm run build`, commit y push.
