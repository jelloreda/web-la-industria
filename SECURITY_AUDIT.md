# Auditoría de seguridad — laindustriabarber.com

Fecha: 2026-10-02 (actualizado tras aplicar H-01, H-02 y H-03) · Alcance: repositorio `jelloreda/web-la-industria` (rama `main`, commit `cad18a1`) y configuración de despliegue.

> **Limitación importante.** Desde el entorno de esta auditoría la conexión a `https://www.laindustriabarber.com/` fue bloqueada por el proxy (HTTP 403 al abrir el túnel), así que **la Fase 2 (producción) no se ha podido verificar**. Todo lo que dependa de lo que realmente responde el sitio, el DNS o el panel de Vercel/GitHub está marcado **"no verificado"**. En la sección 6 tienes los comandos para comprobarlo tú en dos minutos.

## 1. Resumen ejecutivo

La web es sencilla y está bien construida: no hay contraseñas ni claves en el código ni en el historial de git, no hay vulnerabilidades en las librerías que llegan al navegador, y los textos que escribe el visitante no se pueden usar para inyectar código. La clave de acceso a Yeasy (la agenda) vive solo en el servidor. El riesgo real no es que "hackeen la web", sino que **alguien pueda llenar la agenda de citas falsas**, porque el formulario de reserva no tiene límite de uso ni verificación del teléfono. Lo segundo más relevante es legal: faltan la política de privacidad y el aviso legal, y la web recoge nombre y teléfono. El resto son endurecimientos menores. No hay nada crítico ni de severidad alta.

**Avance:** ya están aplicados en el repositorio los arreglos de código de los dos riesgos principales (H-01 y H-02) y las páginas legales (H-03). Para darlos por cerrados faltan acciones tuyas en los paneles de Vercel y rellenar dos datos legales (ver sección 6). El resto de hallazgos (de severidad baja o informativa) siguen pendientes.

## 2. Qué se ha encontrado (stack y superficie)

- **Stack:** React 18 + TypeScript + Vite + Tailwind, compilado a un único `index.html` (`vite-plugin-singlefile`). Backend: 3 Vercel Functions en `api/reservas/*` que hacen de única puerta a `api.yeasy.io`.
- **Hosting:** Vercel (confirmado por `vercel.json`, `.gitignore` con `.vercel`, `@vercel/analytics` y el dominio `app-tawny-eight-37.vercel.app` como homepage del repo). No confirmado por cabeceras de respuesta (acceso bloqueado). No se usa GitHub Pages (`has_pages: false`).
- **Rutas:** una sola página (`/`) más `/api/reservas/servicios` (GET), `/api/reservas/huecos` (GET) y `/api/reservas` (POST). **No existe `reserva.html` ni ninguna página de redirección** en el repo.
- **Formularios:** solo el de reserva (nombre, prefijo, teléfono + campo trampa `website`). No hay formulario de contacto ni newsletter.
- **Terceros:** Vercel Web Analytics (script del propio dominio), iframes de Google Maps (2 sedes), enlaces salientes a Yeasy (`cut.yeasyapp.com`), WhatsApp, Instagram y Google Maps. Fuentes locales (sin Google Fonts). Fotos de barberos desde Cloudinary vía Yeasy.
- **Variables de entorno:** `YEASY_API_TOKEN` (JWT de administrador de Yeasy, ~700 días) en Vercel, Preview y Production según `CLAUDE.md`.
- **Repo público** (`visibility: public`), un único colaborador (admin), `main` sin protección, 3 ramas.

## 3. Hallazgos

*Las referencias de archivo:línea corresponden al commit auditado (`cad18a1`); tras los arreglos algunas líneas se han desplazado.*

| ID | Título | Severidad | Ubicación | Estado |
|----|--------|-----------|-----------|--------|
| H-01 | Reserva sin límite de uso ni verificación: se puede llenar la agenda de citas falsas | **Media** | `api/reservas/index.ts:4-21`, `api/_lib/reservas.ts:28-55` | Parcial: código aplicado; falta rate limit en Vercel |
| H-02 | Previews de Vercel con el token real de administrador | **Media** (no verificado) | Config de Vercel (`CLAUDE.md`: "Preview + Production") | Código aplicado; falta quitar el token de Preview en Vercel |
| H-03 | Sin política de privacidad ni aviso legal; sin información al recoger datos | **Media** | `StepDatos.tsx:114`, `Contact.tsx:160` | Implementado; faltan 2 datos legales (domicilio, Registro Mercantil) |
| H-04 | Mapa de Google carga al entrar en la sección, posibles cookies de terceros sin consentimiento | **Baja** (no verificado) | `Contact.tsx:140` | Pendiente |
| H-05 | La respuesta de reserva revela si un teléfono ya tiene cita a esa hora | **Baja** | `api/_lib/reservas.ts:101-104` | Pendiente |
| H-06 | El directorio de salida es la raíz del repo y `.env` no está ignorado | **Baja** | `.gitignore`, `.vercelignore`, `vercel.json` (`outputDirectory: "."`) | Pendiente |
| H-07 | CSP mejorable (falta `frame-ancestors`, `form-action`, `img-src` amplio) | **Baja** | `vercel.json:34` | Pendiente |
| H-08 | Token de Yeasy con permisos de administrador y vida de ~700 días | **Baja** | `api/_lib/yeasy.ts:39` | Pendiente (acción manual) |
| H-09 | `main` sin protección y workflow de CI sin permisos mínimos | **Baja** | GitHub, `.github/workflows/playwright.yml` | Pendiente |
| H-10 | Entradas sin longitud máxima en el servidor | **Informativa** | `api/_lib/reservas.ts:28-31` | Pendiente |
| H-11 | `vitest` con aviso moderado (solo desarrollo) | **Informativa** | `package.json` (devDependencies) | Pendiente |
| H-12 | Pie con "© 2025", README desactualizado, `.DS_Store` commiteado | **Informativa** | `Contact.tsx:160`, `README.md`, `docs/superpowers/.DS_Store` | Parcial: "© 2025" corregido |

### H-01 — Reserva sin límite de uso ni verificación (Media)

**Estado: parcialmente corregido en código** (tope de 2 citas futuras por teléfono y comprobación de `Origin`). **Pendiente:** regla de rate limit en el Firewall de Vercel (panel) y, a medio plazo, Turnstile y confirmación por WhatsApp/SMS. Un atacante con muchos números distintos sigue sin ser frenado por el tope; solo el rate limit y el CAPTCHA lo cubren.

**Descripción.** `POST /api/reservas` solo se protege con un campo trampa (`website`). Cualquier script puede enviar peticiones con nombre y teléfono válidos (formato) sin que nada lo frene: no hay rate limiting, ni CAPTCHA, ni verificación del teléfono por SMS/WhatsApp, ni tope de citas futuras por teléfono. Cada petición dispara varias llamadas a Yeasy con el token de administrador, incluida la descarga de **toda la lista de clientes de la sede** (`clientes.ts:8`). El repo es público, así que la lógica y las rutas son conocidas. Los `GET` de huecos/servicios tienen caché de 5 s/300 s, pero cambiando parámetros se esquiva.

**Impacto real.** Alguien (competidor, bromista, bot) podría ocupar huecos de la agenda con citas falsas, crear fichas de cliente basura en Yeasy, o usar el teléfono de otra persona para reservarle citas. No hay robo de datos ni acceso a nada más; el daño es de molestias y citas perdidas, y posible consumo de cuota de la API de Yeasy.

**Solución.**
1. Rate limit en Vercel: *Project → Firewall → Add Rule → Rate Limiting*: ruta `/api/reservas` (POST), p. ej. 5 peticiones/10 min por IP; y `/api/reservas/huecos` 60/min. (Comprueba qué incluye tu plan.)
2. Cap por teléfono en `crearReserva`, usando la consulta que ya existe de citas del cliente (`citaPrevia`): rechazar si ya tiene ≥2 citas futuras no anuladas.
3. CAPTCHA invisible (Cloudflare Turnstile gratuito): añadir el token al `PeticionReserva` y validarlo en `validarPeticion` antes de llamar a Yeasy.
4. Cortar peticiones de otros orígenes (barato, no es seguridad fuerte pero filtra scripts torpes), al inicio de `POST`:
```ts
const origen = request.headers.get('origin')
if (origen && new URL(origen).host !== new URL(request.url).host) return errorJson('DATOS_INVALIDOS', 403)
```
5. Aviso por WhatsApp/SMS de confirmación al teléfono reservado (lo ideal a medio plazo; mitiga el uso de teléfonos ajenos).

### H-02 — Previews de Vercel con el token real (Media, no verificado)

**Estado: corregido en código** (el servidor no usa el token si `VERCEL_ENV === 'preview'`). **Pendiente en el panel:** borrar `YEASY_API_TOKEN` del entorno Preview y activar Deployment Protection.

**Descripción.** `CLAUDE.md` indica que `YEASY_API_TOKEN` está en *Preview + Production*. Cada rama/PR genera una URL de preview con la misma API de reservas contra la agenda real. Si esas previews no están protegidas, cualquiera que conozca la URL puede crear citas reales desde ahí. El repo es público, así que los nombres de rama (`feat/...`) se ven.

**Impacto.** Mismo que H-01, pero por una puerta que además esquiva cualquier rate limit configurado solo en producción.

**Solución.** En Vercel → *Settings → Deployment Protection*: activar *Vercel Authentication* para Preview. Si no necesitas reservar desde previews, quita `YEASY_API_TOKEN` del entorno Preview (la API responderá 503 ahí, que es lo seguro).

### H-03 — Sin política de privacidad ni aviso legal (Media)

**Estado: implementado, pendiente de completar datos.** Páginas `/aviso-legal.html` y `/privacidad.html`, enlaces en el pie, aviso con el responsable (INDUSTRIA COL 25, NIF B22737167) y enlace en el formulario de reserva. La política nombra a **FASTBOOK, S.L.** (NIF B42969626, titular de Yeasy) como encargado del tratamiento, con los datos tomados de su política de privacidad que facilitó el titular (no he podido consultar `yeasy.io`, bloqueado desde este entorno); el enlace es a `yeasy.io` en general, sin la URL exacta de su política. **Quedan solo dos marcadores `[COMPLETAR: …]`: domicilio social y datos del Registro Mercantil de INDUSTRIA COL 25**, que hay que rellenar **antes de publicar en producción**. Sin email de contacto por decisión del titular: se ofrece teléfono/WhatsApp y atención presencial (la LSSI admite "otro medio de comunicación electrónica"; conviene que el gestor lo confirme). Pendiente de verificar: las garantías de transferencia de Vercel (EE. UU.) que cita la política, y que el contrato con Yeasy incluya el encargo de tratamiento (art. 28 RGPD). Los textos son un borrador y conviene que los revise un gestor o abogado.

**Descripción.** La web recoge nombre y teléfono (datos personales) y no contiene ninguna política de privacidad, aviso legal ni identificación del titular (búsqueda en `app/src` y `index.html`: 0 resultados). Lo único que se informa es "Tu teléfono solo sirve para gestionar la cita" (`StepDatos.tsx:114`). El RGPD (art. 13) exige informar de responsable, finalidad, base legal, destinatarios (Yeasy es encargado del tratamiento), plazo y derechos; la LSSI (art. 10) exige datos identificativos del titular de la web.

**Impacto.** No es un riesgo técnico; es de cumplimiento. Para un negocio pequeño la probabilidad de sanción es baja, pero es lo que primero reclama una inspección o una queja de un cliente.

**Solución.** Añadir dos páginas/secciones enlazadas desde el pie y desde el formulario ("Al reservar aceptas la [política de privacidad]"): *Aviso legal* (titular, NIF, domicilio, contacto) y *Política de privacidad* (responsable, finalidad: gestionar la cita; base: ejecución de la reserva; destinatario: Yeasy; conservación; derechos y contacto). Conviene que las revise un gestor o abogado; yo puedo redactar un borrador cuando me des los datos fiscales.

### H-04 — Mapa de Google sin consentimiento (Baja, no verificado)

**Descripción.** `Contact.tsx:140` incrusta `maps.google.com/maps?...&output=embed`. Estos embeds suelen instalar cookies de Google al cargarse (con `loading="lazy"` solo al acercarse el usuario). No hay banner ni gestión de consentimiento. Vercel Web Analytics no usa cookies, por lo que por sí solo no requiere banner.

**Impacto.** Si Google instala cookies no técnicas, la LSSI (art. 22.2) pediría consentimiento previo. Riesgo sancionador bajo; fácil de evitar.

**Solución.** Sustituir el iframe por una tarjeta con botón "Ver mapa" que monte el iframe solo tras el clic (añadiendo una frase informativa), o usar una imagen estática del mapa + enlace "Cómo llegar" (que ya existe). Verifica primero en DevTools → Application → Cookies si realmente se crean.

### H-05 — Respuesta que revela citas existentes (Baja)

**Descripción.** Si el teléfono ya tiene una cita en esa fecha y hora, la API devuelve los datos de esa cita (servicio, precio, barbero) en lugar de crear una nueva (`reservas.ts:101-104`).

**Impacto.** Quien conozca un teléfono y pruebe fecha/hora puede averiguar si esa persona tiene cita y con quién. Es poco práctico (hay que adivinar la hora) y la información es poco sensible.

**Solución.** Devolver la confirmación sin barbero/servicio reales, o con los que el solicitante envió, cuando se detecta duplicado:
```ts
if (previa) return aCita(d, servicio, '')
```
(El `servicio` ya viene de la petición; así no se filtra el barbero.) Se resuelve del todo con la verificación de H-01.5.

### H-06 — Salida en la raíz y `.env` sin ignorar (Baja)

**Descripción.** `outputDirectory: "."` hace que lo desplegado sea la raíz del repo. `.vercelignore` excluye docs, tests, `*.md`, etc., pero **no** `.github/`, `app/src/`, `package.json`, `vercel.json`, y `.gitignore` **no incluye `.env*`**. Hoy no hay ningún `.env` commiteado (verificado en todo el historial), y el código fuente ya es público, pero si algún día se crea un `.env` en la raíz y se sube, quedaría descargable en `https://www.laindustriabarber.com/.env`. Que `app/src/**` sea accesible en producción: **no verificado**.

**Impacto.** Hoy: ninguno. Futuro: fuga de secretos por un descuido.

**Solución.** Añadir a `.gitignore` y `.vercelignore`:
```
.env
.env.*
.DS_Store
.github/
```
y, a medio plazo, compilar a `dist/` (`outDir: 'dist'` en `vite.config.ts`, `outputDirectory: "app/dist"` en `vercel.json`) para que solo se sirva lo compilado. Requiere ajustar `playwright.config.ts` y los `public/`, por eso va como cambio mayor.

### H-07 — CSP mejorable (Baja)

**Descripción.** La CSP actual (`vercel.json:34`) es razonable. `'unsafe-inline'` en `script-src` es inevitable con un build de un solo archivo (el riesgo real es bajo: React escapa el contenido y no hay `innerHTML`, `eval` ni parámetros de URL que lleguen al DOM). Falta `frame-ancestors`, `form-action` y `upgrade-insecure-requests`; `img-src https:` permite cargar imágenes de cualquier dominio.

**Impacto.** Marginal para una web estática. Evita clickjacking moderno y exfiltración por formularios si algún día hubiera una inyección.

**Solución.** Valor propuesto (compatible con Vercel Analytics en el mismo dominio, Google Maps, fuentes locales y fotos de Yeasy en Cloudinary):
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com https://*.googleapis.com https://*.gstatic.com; frame-src https://maps.google.com https://www.google.com; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
```
Si prefieres no arriesgarte a que se rompa alguna foto, deja `img-src 'self' data: https:` y añade solo `form-action`, `frame-ancestors` y `upgrade-insecure-requests`. Probar en una preview antes. Opcional: añadir `Cross-Origin-Opener-Policy: same-origin` y ampliar `Permissions-Policy` con `payment=(), usb=()`.

### H-08 — Token de Yeasy de administrador (Baja)

**Descripción.** El endpoint público actúa con un JWT de administrador de ~700 días (`yeasy.ts:39`). Está bien tratado: solo se lee en el servidor, no se registra en logs, no aparece en el bundle (verificado) ni en el historial.

**Impacto.** Si se filtrase (cuenta de Vercel comprometida, log, captura), daría control total de la agenda y clientes de Yeasy.

**Solución.** Variable marcada como *Sensitive* en Vercel; si Yeasy permite una cuenta/rol con menos permisos (solo crear clientes y citas), usarla; apuntar en el calendario la caducidad y rotar el token por precaución si alguien con acceso deja el proyecto.

### H-09 — `main` sin protección y CI sin permisos mínimos (Baja)

**Descripción.** `main` y las demás ramas tienen `protected: false`; un solo colaborador. El workflow `playwright.yml` no declara `permissions:` y fija las acciones por etiqueta, no por SHA. Usa `pull_request` (no `pull_request_target`), que es lo seguro.

**Impacto.** Un push accidental o una cuenta comprometida despliega directamente a producción. Bajo con un único usuario si tiene 2FA.

**Solución.** En el workflow, tras `on:`:
```yaml
permissions:
  contents: read
```
Y en GitHub: regla de rama para `main` (requerir PR y que pase el check de CI, bloquear force-push).

### H-10 — Entradas sin longitud máxima (Informativa)

**Descripción.** El esquema `zod` usa `z.string()` sin `.max()` (`reservas.ts:28-31`). Vercel limita el cuerpo a 4,5 MB y el nombre se rechaza si supera 60 tras normalizar, así que el impacto es nulo en la práctica.

**Solución.**
```ts
sede: z.string().max(30), servicio: z.string().max(40), fecha: z.string().max(10), hora: z.string().max(5),
barbero: z.string().max(40), nombre: z.string().max(100), prefijo: z.string().max(5),
telefono: z.string().max(20), website: z.string().max(200).optional(),
```

### H-11 — Dependencias (Informativa)

`npm audit --omit=dev` (raíz) y `npm audit` (app): **0 vulnerabilidades en producción**. En desarrollo hay 2 avisos moderados en `vitest`/`@vitest/mocker` (lectura de archivos vía mock en el servidor de desarrollo de tests). No llega a producción ni al navegador. Solución: actualizar `vitest` cuando convenga (la corrección requiere salto de versión mayor) y no exponer su servidor a la red. Ninguna dependencia está abandonada; `lucide-react`, `react` y `tailwind-merge` tienen versiones mayores nuevas, sin urgencia.

### H-12 — Limpieza menor (Informativa)

**Estado: parcial.** El año del pie ya es dinámico (`new Date().getFullYear()`). Siguen pendientes el README y el `.DS_Store`.

El pie dice "© 2025" (`Contact.tsx:160`). `README.md` menciona React 19 y un `app/vercel.json` que ya no existe (la configuración real está en `vercel.json` de la raíz). `docs/superpowers/.DS_Store` está commiteado (inofensivo).

## 4. Lo que está bien hecho (no tocar)

- Sin secretos en el código, el historial de git (46 commits revisados), `docs/`, tests ni en el bundle `index.html`. Los fixtures solo guardan campos públicos (sin emails/teléfonos de empleados).
- `YEASY_API_TOKEN` solo en servidor, sin logs del token; en logs solo los 3 últimos dígitos del teléfono.
- Sin `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write`, `localStorage`, ni lectura de parámetros de URL hacia el DOM. React escapa todo. El nombre solo admite letras, apóstrofes y guiones.
- **Sin open redirect:** no hay página de redirección; todos los destinos (Yeasy, WhatsApp, Maps, Instagram) están fijos en `lib/brand.ts`.
- Todos los `target="_blank"` llevan `rel="noopener noreferrer"` y `window.open` usa `noopener,noreferrer`.
- Sin CDNs de terceros para scripts ni fuentes (por tanto, no se necesita SRI). Fuentes locales (mejor para privacidad).
- Cabeceras de seguridad definidas en `vercel.json` (CSP, HSTS 1 año, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy). *Definidas en config; que se sirvan en producción: no verificado.*
- API: validación en servidor con `zod`, teléfono E.164 con `libphonenumber`, fecha limitada a 7 días, sede por lista cerrada (sin SSRF ni acceso arbitrario), re-comprobación del hueco justo antes de reservar, errores genéricos sin detalles internos, campo trampa, sin CORS abierto, timeouts de 10 s a Yeasy.
- Redirección que impide servir `/api/**/*.ts` como estático.
- 73 tests unitarios y el chequeo de tipos de `api/` pasan. CI en GitHub Actions con `npm ci`.
- `.vercelignore` ya excluye docs, tests, scripts y capturas.

## 5. Plan de acción

**Quick wins (menos de 1 hora en total)**
1. Activar Deployment Protection en previews / quitar el token de Preview (H-02). *Código ya aplicado; falta el panel.*
2. Regla de rate limit en el Firewall de Vercel para `/api/reservas` (H-01.1).
3. `.env*`, `.DS_Store`, `.github/` en `.gitignore`/`.vercelignore` (H-06).
4. `permissions: contents: read` en el workflow y protección de `main` (H-09).
5. Límites `.max()` en el esquema (H-10) y fix del duplicado (H-05).
6. Añadir `form-action`, `frame-ancestors`, `upgrade-insecure-requests` a la CSP (H-07).
7. ~~Actualizar "© 2025"~~ (hecho) y README (H-12).

**Cambios mayores**
1. ✅ Política de privacidad + aviso legal enlazados desde pie y formulario (H-03). *Hecho; faltan domicilio y datos registrales.*
2. Turnstile (pendiente) + ✅ tope de citas futuras por teléfono (hecho) (H-01.2-3).
3. Mapa con carga bajo clic (H-04), tras verificar si hay cookies.
4. Confirmación por WhatsApp/SMS al teléfono reservado (H-01.5).
5. Compilar a `dist/` en vez de la raíz (H-06).
6. Actualizar `vitest` (H-11).

## 6. Acciones manuales fuera del repo, y verificaciones pendientes

**Cuentas (no verificable desde aquí):** activar 2FA (idealmente app o llave, no SMS) en GitHub, Vercel, registrador del dominio, cuenta de Yeasy y el correo asociado a todas ellas; revisar miembros y tokens en Vercel y GitHub; en Vercel marcar `YEASY_API_TOKEN` como *Sensitive* y revisar a qué entornos aplica; confirmar que el dominio del registrador tiene bloqueo de transferencia y renovación automática; decidir qué hacer con `app-tawny-eight-37.vercel.app` (redirigir al dominio principal).

**Verificaciones de producción que no he podido hacer (ejecútalas tú y pásame la salida si quieres que las analice):**
```bash
curl -sI https://www.laindustriabarber.com/ | head -30          # cabeceras y servidor
curl -sI http://www.laindustriabarber.com/ | head -5            # http -> https
curl -sI https://laindustriabarber.com/ | head -5               # apex -> www
for p in .git/config .env app/src/lib/brand.ts package.json vercel.json .github/workflows/playwright.yml api/_lib/yeasy.ts; do
  printf "%s -> " $p; curl -s -o /dev/null -w "%{http_code}\n" https://www.laindustriabarber.com/$p; done
curl -s https://www.laindustriabarber.com/ | grep -c sourceMappingURL
dig +short TXT laindustriabarber.com ; dig +short TXT _dmarc.laindustriabarber.com
dig +short CAA laindustriabarber.com ; dig +short CNAME www.laindustriabarber.com
dig +short TXT default._domainkey.laindustriabarber.com   # el selector DKIM depende de tu proveedor de correo
```
Además: abrir la web con DevTools → Application → Cookies (antes de interactuar y tras ver el mapa) y revisar `mxtoolbox.com/SuperTool` o similar para SPF/DKIM/DMARC. Si el dominio no envía correo, igualmente conviene `v=spf1 -all` y `v=DMARC1; p=reject`.

*Sin verificar:* TLS/certificado, redirecciones, cabeceras reales, archivos expuestos en producción, DNS/correo/subdomain takeover, cookies reales, 2FA, permisos de colaboradores en Vercel, configuración de previews.

## 7. Registro de lo comprobado hasta ahora

**Hecho en el repositorio (rama `claude/affectionate-mayer-h2x941`, un commit por hallazgo):**
- H-02: `api/_lib/yeasy.ts` no usa el token si `VERCEL_ENV === 'preview'`; `CLAUDE.md` actualizado (token solo en Production).
- H-01: tope de 2 citas futuras activas por teléfono (`NO_DISPONIBLE`, 429) y rechazo (403) de `POST /api/reservas` con `Origin` de otra web.
- H-03: páginas legales, enlaces en pie y formulario, sitemap.
- Pruebas: 77 tests unitarios y `typecheck:api` correctos; 21 tests e2e correctos en Chromium. Los 2 de `tests/example.spec.ts` (plantilla de Playwright que abre playwright.dev) fallan porque ese dominio está bloqueado desde este entorno. Firefox y WebKit no se han podido probar aquí (navegadores no instalados).

**Comprobado en GitHub (vía API):** repositorio público, un único colaborador (administrador), `main` y las otras ramas sin protección.

**Datos aportados por el titular y no verificados por mí:** razón social y NIF de INDUSTRIA COL 25; texto de la política de privacidad y del aviso legal de Yeasy (FASTBOOK, S.L.). Los dominios `yeasy.io`, `apps.apple.com` y `laindustriabarber.com` están bloqueados desde este entorno.

**Sigue sin verificarse (producción, DNS y paneles):** cabeceras reales, TLS y redirecciones, archivos expuestos, SPF/DKIM/DMARC/CAA, cookies reales (incluido el mapa de Google), 2FA, configuración de previews y permisos en Vercel, y si la regla de rate limit está disponible en tu plan.
