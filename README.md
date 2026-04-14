# La Industria — Barbería

Landing page para La Industria, barbería en Madrid. Site de una sola página construido con React + Vite, desplegado en Vercel.

## Stack

- **React 19** + **TypeScript**
- **Vite** + `vite-plugin-singlefile` — build a un único `index.html` autocontenido
- **Tailwind CSS** con tokens de color y fuentes personalizadas
- **shadcn/ui** — Card, Button, Badge, Sheet
- **Magic UI** — Particles, Typewriter, ShimmerButton, BorderBeam, Marquee
- **Playwright** — tests E2E

## Secciones

| Sección | Descripción |
|---------|-------------|
| Hero | Logo, titular animado con Typewriter, CTAs, marquee de reseñas Google 5★ |
| Services | Catálogo de servicios con precios |
| Team | Presentación del equipo |
| Booking | CTA de reserva vía Yeasy |
| Gallery | Galería de fotos |
| Contact | Dirección, horario, teléfono, WhatsApp, Instagram y mapa embebido |

## Desarrollo

```bash
cd app
npm install
npm run dev       # Vite dev server con HMR → http://localhost:5173
npm run build     # TypeCheck + build de producción → ../index.html
npm run preview   # Preview del build en local
```

Tests E2E (desde la raíz):

```bash
npx playwright test        # headless
npx playwright test --ui   # modo interactivo
```

## Estructura

```
├── app/
│   ├── src/
│   │   ├── App.tsx              # Composición de secciones
│   │   ├── components/          # Una sección por archivo
│   │   │   ├── magicui/         # Particles, Typewriter, ShimmerButton, BorderBeam, Marquee
│   │   │   └── ui/              # shadcn Card, Button, Badge, Sheet
│   │   ├── lib/
│   │   │   ├── brand.ts         # URLs, teléfono, WhatsApp, dirección, horarios
│   │   │   └── utils.ts         # cn() helper
│   │   └── assets/
│   │       └── fonts/coolvetica/
│   └── vercel.json              # Config de build y security headers
├── tests/                       # Playwright E2E
├── index.html                   # Output del build (no editar manualmente)
└── docs/superpowers/            # Specs y planes de implementación
```

## Fuentes

| Clase Tailwind | Fuente | Uso |
|----------------|--------|-----|
| `font-coolvetica` | Coolvetica Rg (local `.otf`) | Títulos (h1, h2, h3) |
| `font-work-sans` | Work Sans Variable (`@fontsource-variable/work-sans`) | Cuerpo, nav, botones |

## Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `carbon` | `#414040` | Fondo primario |
| `dark2` | `#333231` | Secciones alternadas |
| `gray-stone` | `#7F7F7D` | Texto secundario |
| `arena` | `#A4A4A4` | Texto de apoyo |
| `cream` | `#E9E4DB` | Acento claro |
| `cream-bg` | `#F0ECE5` | Superficies claras |

## Despliegue

Vercel lee `app/vercel.json`. El build genera `index.html` en la raíz del repo (`outputDirectory: ".."`). La rama `main` despliega automáticamente a producción.

Security headers activos en todas las rutas: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
