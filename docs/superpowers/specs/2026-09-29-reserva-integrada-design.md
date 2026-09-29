# Reserva integrada con Yeasy — diseño

**Fecha:** 2026-09-29 · **Estado:** pendiente de revisión · **Rama:** `feat/reserva-integrada`
**Diseño visual aprobado:** [Claude Design — Reserva integrada La Industria](https://claude.ai/artifact/JiTUuxoMHQ9Zfk9NHtg65k) (prototipo móvil, pasos 0–4, estados, escritorio)

## 1. Objetivo

Hoy cada "Reservar" de la web saca al cliente a la web de Yeasy. Queremos que el cliente reserve **sin salir de la web**, con un flujo propio parecido al de Yeasy:

1. Elige sede (solo si entra desde un CTA genérico).
2. Elige servicio de esa sede (traído de Yeasy).
3. Elige día, barber y hora entre los huecos reales de Yeasy.
4. Deja nombre completo y teléfono. El servidor busca al cliente en Yeasy por teléfono; si no existe lo crea. Después crea la cita.
5. Ve la confirmación.

La sección **Servicios** desaparece: los servicios y precios se ven dentro del flujo.

**Éxito:** un cliente reserva desde la web, la cita aparece en la agenda de Yeasy de la sede correcta, asignada al barber correcto, a nombre de su ficha de cliente (nueva o existente), sin duplicar clientes.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Arquitectura | Vercel Functions en `/api/*` del mismo repo (enfoque A). El token de Yeasy vive solo en el servidor. |
| Identificación del cliente | Por teléfono, en silencio en el servidor. La web **nunca** dice si un teléfono ya es cliente ni muestra datos de su ficha. |
| Datos que se piden | Nombre completo y teléfono. **Sin email.** |
| Normalización de nombres | Cada palabra con la primera letra en mayúscula y el resto en minúscula ("álvaro MARTÍN" → "Álvaro Martín"). Se aplica al guardar; no se muestra en la UI. |
| Teléfono | Selector de prefijo (España +34 por defecto, más 10 países frecuentes) + número. Se guarda en formato E.164 sin espacios (`+34612345678`), igual que el 97 % de las fichas actuales. |
| Rango reservable | Hoy + 6 días (7 días). Para más adelante: enlace "¿Más adelante? Escríbenos por WhatsApp". |
| Contenedor | Panel superpuesto: hoja a pantalla completa en móvil, panel lateral de 480 px en escritorio. |
| Barbers | "Cualquiera" + solo los barbers **con algún hueco el día elegido**. Si el barber elegido no trabaja el nuevo día, se vuelve a "Cualquiera" con aviso. Fotos de Yeasy. Nombres tal cual en Yeasy. |
| Servicios | Solo los anteriores al separador "⬇️ Extras ⬇️" de Yeasy. Nombres limpios mediante un mapa propio. |
| Hueco ocupado al confirmar | Igual que Yeasy: se vuelve a comprobar antes de crear. Si ya no está libre, el cliente vuelve al paso de hora con aviso y huecos actualizados, **conservando nombre y teléfono**. |
| Extras de v1 | Solo "Cualquier barber". Fuera: varios servicios por cita, enlace de respaldo a Yeasy cuando algo falla, aviso de token caducado. |

## 3. Fuera de alcance (v1)

- Varios servicios en una misma cita.
- Cancelar o mover citas desde la web (se hace por WhatsApp).
- Verificación por SMS.
- Enlace de respaldo a Yeasy en los errores.
- Alertas automáticas cuando caduque el token.
- Cambiar las listas estáticas de barbers de las secciones Equipo y Sedes (siguen saliendo de `brand.ts`).
- Pagos o señales.

## 4. Lo que sabemos de la API de Yeasy

Verificado el 2026-09-29 contra la API real (`https://api.yeasy.io`). Los endpoints públicos no necesitan token.

### 4.1 Lectura (públicos, sin token)

| Endpoint | Uso | Notas |
|---|---|---|
| `GET /services/clientweb?commerce=<uuid>` | Catálogo de servicios | `price` en euros enteros + `decimal`, `defaultDuration` en min, `order`, `isPublic`, `isDeleted`, `category` siempre `null`. |
| `GET /employee/commerce/<uuid>` | Empleados | Trae `name`, `position`, `image` (Cloudinary), `isActive`, `timetable` por día. **No hay campo de baja**: todos salen `isActive: true`. |
| `POST /availability` | Huecos de **un día exacto** | Body: `{ commerce, date: "YYYY-MM-DD", servicesDuration, serviceCollection: [servicio], userTimezone: "Europe/Madrid" }`. Devuelve una entrada por empleado (más una entrada `uuid: "all"` = "Cualquiera") con `availability.{morning,afternoon,evening}[]`, cada hueco con `date` (ISO UTC), `label` ("17:30") y `employee[]` (quién está libre). Ya excluye a quien está de baja (Sanmil no aparece) y a quien no trabaja ese día (Wuilliams los lunes). |

**No usar `POST /availability/v2`** (el que usa la web de Yeasy): devuelve el **primer día con huecos a partir** de la fecha pedida. Un domingo cerrado devuelve los huecos del lunes.

### 4.2 Escritura (con `YEASY_API_TOKEN`, cuenta de administrador)

Base: `yeasy-mcp-server` en `contabilidad-la-industria/` (código probado en producción).

| Endpoint | Uso |
|---|---|
| `POST /availability/employee` | Revalidar que un barber sigue libre en fecha/hora/duración. Devuelve `true`/`false`. |
| `POST /booking/limit` | Segundo chequeo de solapamientos. Devuelve `[]` si no hay conflicto. |
| `POST /customer/commerce/get-existing-customer` | Buscar cliente por teléfono (y email). |
| `GET /customer/commerceAndCreatedBynewV2/<commerce>` | Lista de clientes de la sede (~1.600–1.800), con `phone` e `isBlocked`. Alternativa de búsqueda. |
| `POST /customer/commerce` | Crear cliente `{ name, lastname, email, phone, password: "", createdBy, createdByCommerce: true }`. |
| `POST /booking/commerce` o `POST /booking` | Crear la cita (ver Tarea 0). La web de Yeasy usa `POST /booking` con `createdByType: "customer"` y `createdUUID: <cliente>`; el MCP usa `/booking/commerce` con `createdByType: "employee"`. |
| `POST /push-notification/create-booking` | Avisar al barber (el MCP lo hace tras crear). |

### 4.3 Formato de los teléfonos en Yeasy

De 3.391 clientes (las dos sedes), el 97 % sigue el patrón `+34XXXXXXXXX`. El resto son prefijos extranjeros (+44, +33…), una veintena vacíos y unos pocos con guiones (`+3461-234-5678`). La búsqueda compara **solo cifras**.

### 4.4 Tarea 0: contratos por confirmar antes de implementar

Cada punto se prueba con el token y se deja en fixtures JSON para los tests. Los que crean datos reales se hacen **solo con permiso explícito de Jaime**, en una fecha lejana, y se borran después.

1. ¿`get-existing-customer` encuentra un cliente **solo con teléfono** (email vacío)? Si no, se busca en la lista de clientes de la sede, en memoria del servidor.
2. ¿`POST /customer/commerce` acepta `email: ""`?
3. ¿Qué endpoint crea la cita y cómo aparece en Yeasy?
   - Se prefiere `POST /booking` con `createdByType: "customer"`, para que cuente como reserva de cliente y no de empleado.
   - Si el token de administrador no lo permite, se usa `POST /booking/commerce`.
4. ¿Yeasy avisa al cliente (SMS, email, push) cuando se crea la cita de cualquiera de las dos formas?
5. Forma exacta de la entrada "Cualquiera" en `/availability` cuando hay varios barbers libres, y huecos de noche (`evening`).

## 5. Arquitectura

```
Navegador (index.html autocontenido)
  └─ BookingPanel (React) ──fetch──► /api/reservas/*  (Vercel Functions, Node)
                                        ├─ lectura ──► api.yeasy.io (endpoints públicos)
                                        └─ escritura ─► api.yeasy.io (Bearer YEASY_API_TOKEN)
```

- El navegador **solo** habla con `/api/*` (misma origen). La CSP actual (`connect-src 'self'`) no cambia. Las fotos de Cloudinary ya están permitidas por `img-src https:`.
- Las funciones viven en `api/` en la **raíz del repo**, porque la raíz es el proyecto de Vercel. El código compartido va en `api/_lib/`: las carpetas con `_` no se publican como endpoints. Las dependencias del servidor (`zod`, `libphonenumber-js`) van en el `package.json` de la raíz.
- Runtime Node por defecto (Fluid Compute). Handlers con la firma web estándar (`export async function GET(request: Request)`).

### 5.1 Endpoints propios

**`GET /api/reservas/servicios?sede=<id>`**
Responde `{ servicios: [{ id, nombre, precio, desde, duracion }] }`.
- Filtro: `isPublic && !isDeleted`, sin el separador y sin nada ordenado después de él.
- Orden: por `order`.
- Nombres limpios (§6.2).
- Caché: `s-maxage=300, stale-while-revalidate=600`.

**`GET /api/reservas/huecos?sede=<id>&servicio=<id>&fecha=YYYY-MM-DD`**
Responde `{ fecha, barberos: [{ id, nombre, foto }], huecos: [{ hora: "17:30", franja: "manana"|"tarde"|"noche", barberos: [id…] }] }`.
- Rechaza con 422 las fechas fuera de hoy…hoy+6, calculadas en Europe/Madrid.
- La duración se toma del servicio en Yeasy, nunca del cliente.
- `barberos` solo incluye a quien tiene al menos un hueco ese día y no tiene puesto Admin/Administrador.
- Caché: `s-maxage=20, stale-while-revalidate=40`.

**`POST /api/reservas`**
Body: `{ sede, servicio, fecha, hora, barbero: "any"|<id>, nombre, prefijo, telefono, website }`. `website` es un campo trampa oculto para bots.

Pasos del servidor:
1. Valida con zod.
   - Nombre: al menos 2 palabras y como mucho 60 caracteres; se normaliza (§6.3).
   - Teléfono: `libphonenumber-js` `isValidPhoneNumber`. Con +34, además, 9 cifras que empiecen por 6–9. Se pasa a E.164.
   - Si `website` viene relleno, finge éxito y no hace nada.
2. Relee el servicio de Yeasy (precio y duración de confianza).
3. Pide `/availability` de ese día y resuelve el barber.
   - "Cualquiera": el primero de `employee[]` en ese hueco, como hace Yeasy.
   - Barber concreto: comprueba que está libre a esa hora.
4. Revalida con `/availability/employee` y `/booking/limit`. Si falla → **409 `HUECO_OCUPADO`**.
5. Busca el cliente por teléfono en esa sede.
   - Si existe y `isBlocked` → **409 `NO_DISPONIBLE`**, un error genérico que no revela nada.
   - Si no existe → lo crea.
6. Evita duplicados: si el cliente ya tiene una cita a esa misma fecha y hora, devuelve éxito con la cita existente.
7. Crea la cita con el endpoint confirmado en la Tarea 0 y notifica al barber. Si la notificación falla, no se deshace la cita.
8. Responde **201** `{ cita: { sede, servicio, precio, fecha, hora, duracion, barbero, direccion } }`.

Errores: 422 `DATOS_INVALIDOS` (con `campos`), 409 `HUECO_OCUPADO`, 409 `NO_DISPONIBLE`, 503 `AGENDA_NO_DISPONIBLE` (Yeasy caído, 401/403 de token, 429, timeout de 10 s).

### 5.2 Módulos de servidor (`api/_lib/`)

| Archivo | Responsabilidad |
|---|---|
| `yeasy.ts` | Cliente HTTP: base URL, `x-app-version`, token, timeout, traducción de errores a los códigos de §5.1. |
| `sedes.ts` | Mapa `sede id → { commerceUuid, userUuid }`. Los UUID de comercio no son secretos. El `userUuid` (quién crea al cliente) sale del `.env` del MCP y va como variable de entorno. |
| `servicios.ts` | Filtro por separador, orden y mapa de nombres limpios. |
| `huecos.ts` | Mapea la respuesta de `/availability` a la forma de §5.1. Filtra personal. Construye la URL de foto de Cloudinary (`c_fill,g_face,w_200,h_200`). |
| `clientes.ts` | Buscar por cifras del teléfono y crear. Normaliza nombre y teléfono. |
| `reservas.ts` | Orquesta el `POST` (pasos 2–8). |
| `fecha.ts` | "Hoy" y el rango de 7 días en Europe/Madrid; semana ISO para el body de la cita. |

## 6. Datos y normalización

### 6.1 Barbers
- Se excluyen los empleados con `position` Admin o Administrador y la entrada `uuid: "all"` (esa se muestra como "Cualquiera").
- Cada día solo se muestran los barbers con huecos ese día. Así se cubren bajas (Sanmil), días libres (Wuilliams los lunes, Luz los sábados) y el personal de administración.
- Nombre: el de Yeasy, sin espacios sobrantes.
- Foto: la de Yeasy vía Cloudinary, en blanco y negro con CSS. Si no hay foto, se muestra la inicial.

### 6.2 Servicios
- Separador: el servicio cuyo nombre contiene "extras" (sin distinguir mayúsculas). Se ocultan él y todos los de `order` mayor o igual.
  - **Aviso:** "Barba + cejas" de Argüelles tiene `order` 99 y queda oculto. Para mostrarlo hay que subirlo por encima del separador en Yeasy.
- Nombres: mapa `uuid de Yeasy → nombre limpio` en `servicios.ts`, con los mismos nombres en las dos sedes (tabla del diseño). "Desde" pasa del nombre al precio ("Desde 27 €").
- Servicio nuevo sin entrada en el mapa: limpieza automática (recortar espacios, espacio alrededor de "+", tras comas y antes de "(", primera letra en mayúscula).

| Nombre limpio | Precio | Duración |
|---|---|---|
| Corte y degradado a máquina | 16 € | 30 min |
| Cejas + corte y degradado | 17 € | 30 min |
| Corte a tijera + taper (mullet, warrior, modcut) | 18 € | 30 min |
| Corte y degradado + barba | 25 € | 60 min |
| Corte a tijera y barba | Desde 27 € | 60 min |
| Asesoramiento y corte | 18 € | 40 min (G) / 30 min (A) |
| Corte de pelo premium | 18 € | 30 min |
| Corte y barba premium | 27 € | 60 min |
| Arreglo de barba | 15 € | 30 min |
| Corte a tijera corto | 20 € | 30 min |
| Corte a tijera clásico (M) | 22 € | 30 min |
| Corte a tijera largo (L) | 24 € | 30 min |
| Corte a tijera extra largo (XL) | 26 € | 30 min |
| Limpieza facial + corte | 30 € | 60 min |
| Limpieza facial + corte y barba | 39 € | 90 min |
| Corte jubilado | 12 € | 15 min (G) / 20 min (A) |

Precios y duraciones siempre se leen en vivo de Yeasy; la tabla es solo de referencia.

### 6.3 Nombre del cliente
- Se recortan espacios y se colapsan los dobles.
- En cada palabra y cada parte con guion: primera letra en mayúscula y el resto en minúscula, con locale `es`.
- `name` = primera palabra; `lastname` = el resto.

### 6.4 Teléfono
- Se quitan espacios, puntos y guiones, y se valida con `libphonenumber-js` según el prefijo. Se guarda en E.164.
- La búsqueda compara las cifras del E.164 con las cifras del `phone` de cada ficha.

## 7. Frontend

### 7.1 Componentes (`app/src/components/booking/`)

| Componente | Responsabilidad |
|---|---|
| `BookingProvider.tsx` | Sustituye a `LocationPickerProvider`. Expone `useBooking()` → `open(sedeId?)`. Sin sede, empieza en el paso 0. Guarda el estado del flujo con `useReducer`. |
| `BookingPanel.tsx` | Radix Dialog (ya instalado). Hoja inferior a pantalla completa en móvil (<768 px) y panel lateral derecho de 480 px en escritorio. Cabecera con volver, eyebrow "Reservar · <sede>", cerrar, título y barra de progreso de 3 pasos. Pie fijo con el CTA. |
| `StepSede.tsx` | Tarjetas de sede (el `LocationPicker` actual, reutilizado). |
| `StepServicio.tsx` | Lista de servicios. Al pulsar uno avanza. |
| `StepHueco.tsx` | Tira de 7 días (domingo deshabilitado), enlace a WhatsApp, fila de barbers ("Cualquiera" + los de ese día), huecos por franja en rejilla de 4, estados de carga / sin huecos / hueco ocupado. |
| `StepDatos.tsx` | Resumen (servicio, día, hora, barber) con "Cambiar", nombre, prefijo + teléfono, texto de privacidad y CTA "Reservar cita". |
| `StepConfirmacion.tsx` | Check, "Te esperamos en <sede>. Nos vemos en el sillón.", resumen, dirección, enlace a WhatsApp para cambios, "Cómo llegar" y "Cerrar". |
| `app/src/lib/booking-api.ts` | `fetch` tipado a `/api/reservas/*` y mapeo de códigos de error a textos. |

**Estado:** `{ paso, sedeId, servicio, fecha, barbero, hueco, nombre, prefijo, telefono, avisoHuecoOcupado, avisoBarberoLibre }`. Al cerrar el panel se reinicia.

**Datos:**
- Servicios: se piden al entrar en el paso 1.
- Huecos: se piden al elegir día y se cachean por `(sede, servicio, fecha)` mientras el panel está abierto.
- Al volver del 409 se vuelve a pedir el día.

**Validación en cliente:** con +34, 9 cifras que empiecen por 6–9; con otro prefijo, 6–12 cifras. Los errores se muestran al intentar enviar. La validación definitiva es la del servidor (422 → errores por campo).

### 7.2 Textos

| Situación | Texto |
|---|---|
| Sin huecos ese día | "No quedan huecos este día" + "No hay horas libres con <barber / ningún barber> el <día>. Prueba otro día u otro barber." + botón al siguiente día con huecos |
| Domingo | "Los domingos cerramos" |
| Barber no trabaja ese día | "<Barber> no trabaja el <día>. Te enseñamos los huecos de todo el equipo." |
| 409 hueco ocupado | "Esa hora ya no está disponible" + "Alguien la ha reservado mientras completabas tus datos. Hemos actualizado los huecos: elige otra y la guardamos con tus datos." |
| 409 no disponible / 503 | "No hemos podido completar la reserva. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp." |
| Nombre inválido | "Escribe tu nombre y al menos un apellido." |
| Teléfono inválido (+34) | "Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9." |
| Teléfono inválido (otros) | "Revisa el teléfono: solo cifras, sin el prefijo." |
| Privacidad | "Si ya has venido antes, usamos tu ficha. Tu teléfono solo sirve para gestionar la cita." |

### 7.3 Accesibilidad
- Botones reales, `aria-pressed` en barbers y huecos, `aria-label` en volver y cerrar, y `role="alert"` en los avisos.
- Foco dentro del diálogo (Radix) y foco al título en cada cambio de paso.
- Objetivos táctiles de 44 px como mínimo.

## 8. Cambios en la web existente

| Archivo | Cambio |
|---|---|
| `App.tsx` | Quitar `<Services />`. `LocationPickerProvider` → `BookingProvider`. |
| `components/Services.tsx` | Borrar. |
| `components/LocationPicker.tsx` | Borrar; su contenido pasa a `StepSede`. |
| `Nav.tsx` | Quitar el enlace "Servicios". "Reservar" → `open()`. |
| `Hero.tsx` | "Reservar cita" → `open()`. "Ver servicios" → "Ver sedes" (`#reservas`). |
| `HeroCampaign.tsx` | Las tarjetas de sede → `open(sedeId)` en lugar de enlazar a Yeasy. |
| `Booking.tsx` | "Reservar aquí" → `open(sedeId)`. Pie: "Cada sede tiene su propia agenda". |
| `Contact.tsx` | "Reservar aquí" de cada pestaña → `open(sedeId)`. |
| `lib/brand.ts` | Añadir `yeasyCommerceUuid` a cada sede. Mantener `bookingUrl` (interruptor, §10). |
| Fondos de sección | Al quitar Servicios, Hero y Equipo quedarían seguidos en `dark2`. **Hero pasa a `carbon`** (y las tarjetas de `HeroCampaign` que eran `bg-carbon` pasan a `bg-dark2`). Orden final: Hero `carbon` · Equipo `dark2` · Sedes `carbon` · Contacto `dark2` · Footer `carbon`. Es el cambio mínimo; el resto conserva su color. |
| `CLAUDE.md` | Actualizar arquitectura, tabla de fondos, API, variables de entorno y tests. |

## 9. Seguridad y privacidad

- `YEASY_API_TOKEN` es una variable de entorno de Vercel marcada como sensible. Solo `api/_lib/yeasy.ts` la lee, y nunca se registra ni se devuelve.
- **Superficie mínima:** solo existen los 3 endpoints de §5.1. No hay proxy genérico hacia Yeasy.
- **Sin filtración de datos:**
  - Las respuestas nunca incluyen datos de la ficha del cliente.
  - "No existe", "creado" y "encontrado" se comportan igual para el usuario.
  - Un cliente bloqueado recibe el mismo error genérico que un fallo de agenda.
- **Abuso:**
  - Reglas de límite de peticiones en el Vercel Firewall: `POST /api/reservas` con 5 peticiones cada 10 min por IP, y `GET /api/reservas/*` con 60 por minuto por IP.
  - Campo trampa `website`.
  - Protección contra duplicados (§5.1 paso 6).
- **Logs:** sin teléfonos completos (solo las 3 últimas cifras) ni nombres.
- Sin CORS: solo misma origen.

## 10. Configuración y despliegue

- Variables de entorno en Vercel (Preview y Production):
  - `YEASY_API_TOKEN`: token de la cuenta, el mismo que usa el MCP.
  - `YEASY_USER_UUID_GUZMAN` y `YEASY_USER_UUID_ARGUELLES`: el empleado con el que se crean los clientes, sacado del `.env` del MCP.
- Interruptor `BOOKING_MODE: 'integrada' | 'yeasy'` en `brand.ts`. Con `'yeasy'`, `open(sedeId)` abre el `bookingUrl` de la sede como hoy. Sirve para volver atrás con un commit de una línea si algo va mal en producción, sin revertir la funcionalidad.
- **Desarrollo local:** `vercel dev` sirve la web y las funciones juntas. `npm run dev` (Vite) sigue funcionando para la UI con un proxy de `/api` hacia `vercel dev`.
- **Despliegue:**
  1. Preview de Vercel con las variables configuradas.
  2. Una reserva real de prueba hecha junto con Jaime, que se borra después.
  3. Merge a `main`.

## 11. Pruebas

- **Unitarias (vitest, `api/_lib`)**, con fixtures reales capturados en la Tarea 0:
  - filtro de servicios y separador;
  - limpieza de nombres;
  - mapeo de huecos y filtro de personal;
  - normalización del nombre;
  - validación y E.164 del teléfono;
  - rango de fechas en Madrid;
  - orquestación de `POST` con el cliente HTTP simulado: cliente existente, cliente nuevo, bloqueado, hueco ocupado, duplicado y token caducado.
- **E2E (Playwright)**, con `page.route` simulando `/api/reservas/*`:
  - flujo completo desde el Nav (sede → servicio → hueco → datos → confirmación);
  - entrada directa desde la tarjeta de una sede (empieza en el paso 1);
  - "Cualquiera" y cambio a un día en que el barber no trabaja;
  - errores de validación;
  - 409 → vuelta a huecos conservando los datos;
  - 503.
- **Tests existentes a actualizar:**
  - Quitar el de fondo de Servicios.
  - "each location card books on its own Yeasy account" → "abre el flujo en esa sede".
  - El del selector de sede → paso 0 del panel.
  - Se mantienen las capturas de escritorio y móvil.

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| La API de Yeasy no es oficial y puede cambiar sin aviso | Toda la integración en `api/_lib/yeasy.ts`. Tests con fixtures reales. El interruptor `BOOKING_MODE` devuelve a los enlaces de Yeasy en minutos. |
| El token (~700 días) caduca o se revoca | 503 con mensaje claro para el cliente y error en los logs de Vercel. **No hay alerta automática ni respaldo en la UI (decisión de v1)**: renovarlo sigue el README del MCP. |
| Token de administrador con acceso total a las dos sedes | Solo en el servidor, 3 endpoints acotados, validación estricta y límite de peticiones. |
| Reservas falsas o masivas | Límite de peticiones, campo trampa y protección contra duplicados. Se revisa tras el lanzamiento; si hay abuso, se añade BotID o verificación por SMS. |
| Las citas creadas por la cuenta no cuentan como "reserva web" en las estadísticas de Yeasy | Se resuelve en la Tarea 0 (punto 3). |
