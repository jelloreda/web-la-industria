# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All app commands run from the `app/` directory:

```bash
cd app
npm run dev        # Start Vite dev server with HMR
npm run build      # Type-check + production build
npm run preview    # Preview production build locally
```

E2E tests run from the root:

```bash
npx playwright test           # Run all tests (headless)
npx playwright test --ui      # Interactive test runner
```

Unit tests (server logic + booking client logic) and API type-check run from the root:

```bash
npm test                 # vitest (tests-unit/)
npm run typecheck:api    # tsc over api/
vercel dev               # web + /api functions together on :3000 (Vite dev proxies /api there)
```

## Architecture

**La Industria** is a single-page barber shop landing site that builds to a single self-contained `index.html` (no separate assets). The Vite config uses `vite-plugin-singlefile` to inline all assets and outputs to the parent directory.

### Source layout (`app/src/`)

- `App.tsx` — Composes Nav → Hero → Team → Booking → Contact inside `BookingProvider`. There is no Services section: services and prices live inside the booking flow.
- `components/` — One file per section, plus `magicui/` (Particles, Typewriter, ShimmerButton, BorderBeam, Marquee) and `ui/` (shadcn Card, Button, Badge, Sheet)
- `lib/brand.ts` — Single source of truth for brand data. `LOCATIONS` holds both sedes (Guzmán el Bueno, Argüelles), each with its own Yeasy booking URL, address, phone/WhatsApp, hours, map links and barbers. `CAMPAIGN_ACTIVE` toggles the temporary "dos sedes" hero campaign (planned until end of October 2026).
- `components/booking/` — In-site booking flow (Radix Dialog panel: sede → servicio → día/barber/hora → datos → confirmación). Any "Reservar" CTA calls `useBooking().open(sedeId?)`. State in `estado.ts` (reducer); API calls in `lib/booking-api.ts`. `BOOKING_MODE` in `lib/brand.ts` switches back to plain Yeasy links (`'yeasy'`) as a kill switch.
- `components/HeroCampaign.tsx` — Campaign hero shown instead of the classic hero while `CAMPAIGN_ACTIVE` is true; the Nav also shows a cream announcement bar then.
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

### Booking API (`api/`, repo root)

Vercel Functions, the only door to `api.yeasy.io`. `api/_lib/` is shared code (not routed).

| Endpoint | Does |
|---|---|
| `GET /api/reservas/servicios?sede=` | Public services before the "Extras" separator, clean names (map in `_lib/servicios.ts`) |
| `GET /api/reservas/huecos?sede=&servicio=&fecha=` | Slots for one day via `POST /availability` (never `/availability/v2`, which jumps to the next open day). Only barbers with slots that day, no admin staff |
| `POST /api/reservas` | Validates, re-checks the slot, finds the customer by phone (digits only) or creates it, avoids duplicates, creates the booking |

Env vars (Vercel, Preview + Production): `YEASY_API_TOKEN` (admin JWT, ~700 days — renewal steps in `contabilidad-la-industria/yeasy-mcp-server/README.md`), `YEASY_USER_UUID_GUZMAN`, `YEASY_USER_UUID_ARGUELLES`. `scripts/yeasy-sonda.mjs` re-checks the Yeasy contracts.

### Styling

Custom Tailwind color tokens (defined in `tailwind.config.ts`):

| Token | Hex | Usage |
|-------|-----|-------|
| `carbon` | `#414040` | Primary background |
| `dark2` | `#333231` | Alternating sections |
| `gray-stone` | `#7F7F7D` | Secondary text |
| `arena` | `#A4A4A4` | Support text |
| `cream` | `#E9E4DB` | Light accent |
| `cream-bg` | `#F0ECE5` | Light surfaces |

Fonts (defined in `tailwind.config.ts` + `src/index.css`):

| Tailwind class | Font | Source | Usage |
|----------------|------|--------|-------|
| `font-coolvetica` | Coolvetica Rg | Local `.otf` at `app/src/assets/fonts/coolvetica/` | Títulos y subtítulos (h1, h2, h3) |
| `font-work-sans` | Work Sans Variable | `@fontsource-variable/work-sans` | Cuerpo, etiquetas, botones, nav |

Path alias `@/` maps to `app/src/`.

### Testing

Playwright tests in `tests/` run against the built `index.html` served on `127.0.0.1:4173` (python http.server) with `/api/reservas/*` mocked (`tests/mocks/reservas.ts`); they cover the page and the full booking flow. Vitest covers `api/_lib` and the booking client logic. Rebuild `index.html` before the e2e (`cd app && npm run build`). CI runs on GitHub Actions (`push` to main and PRs).

### Section background colors

Sections alternate between `bg-carbon` and `bg-dark2`:

| Section | Background |
|---------|-----------|
| Hero | `carbon` |
| Team | `dark2` |
| Booking | `carbon` |
| Contact | `dark2` |
| Footer | `carbon` |

### Deployment

The Vercel project root is the repo root, so Vercel reads the top-level `vercel.json` (not `app/vercel.json` — there is no such file). It defines the build command (`cd app && npm install && npm run build`), install command (`npm install` at the root, since the `api/` functions need `zod` and `libphonenumber-js` from the root `package.json`), output directory (`.`, where `index.html` lands), a redirect that stops `api/_lib/*` being served as static files, and security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) applied to all routes.

`app/public/` holds static files served as-is (favicon, OG image, `robots.txt`, `sitemap.xml`) — Vite copies this directory into the build output alongside the generated `index.html`.

### Design spec

Full section-by-section design decisions (copy, layout, animations, constraints) are documented in `docs/superpowers/specs/2026-03-30-la-industria-landing-design.md`. All copy is in Spanish.
