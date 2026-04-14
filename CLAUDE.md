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

## Architecture

**La Industria** is a single-page barber shop landing site that builds to a single self-contained `index.html` (no separate assets). The Vite config uses `vite-plugin-singlefile` to inline all assets and outputs to the parent directory.

### Source layout (`app/src/`)

- `App.tsx` — Composes all 7 section components in order: Nav → Hero → Services → Team → Booking → Gallery → Contact
- `components/` — One file per section, plus `magicui/` (Particles, Typewriter, ShimmerButton, BorderBeam, Marquee) and `ui/` (shadcn Card, Button, Badge, Sheet)
- `lib/brand.ts` — Single source of truth for all brand data: booking URL, Instagram, WhatsApp, phone, address, hours, map embeds
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

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

Playwright tests in `tests/la-industria.spec.ts` cover: no console errors, hero visibility, booking CTA URL/attributes, Services section background, and desktop/mobile screenshots. CI runs on GitHub Actions (`push` to main and PRs).

### Section background colors

Sections alternate between `bg-carbon` and `bg-dark2`:

| Section | Background |
|---------|-----------|
| Hero | `dark2` |
| Services | `carbon` |
| Team | `dark2` |
| Booking | `carbon` |
| Gallery | `dark2` |
| Contact | `dark2` |
| Footer | `carbon` |

### Deployment

Vercel reads `app/vercel.json`: build command `npm run build`, output directory `..` (the repo root where `index.html` lands). Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are defined there and applied to all routes.

### Design spec

Full section-by-section design decisions (copy, layout, animations, constraints) are documented in `docs/superpowers/specs/2026-03-30-la-industria-landing-design.md`. All copy is in Spanish.
