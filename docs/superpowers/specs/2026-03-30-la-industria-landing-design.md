# Spec: Landing Page — La Industria

**Date:** 2026-03-30
**Status:** Approved
**Project dir:** `Documents/Claude/Projects/Web - La Industria/`

---

## Brand Tokens (from Manual de Marca v5)

| Token | Value | Role |
|---|---|---|
| Carbón | `#414040` | Color principal / primary bg |
| Gris Piedra | `#7F7F7D` | Color secundario / muted text |
| Arena | `#A4A4A4` | Color de apoyo / secondary text |
| Crema | `#E9E4DB` | Light accent / headings on dark |
| Crema BG | `#F0ECE5` | Light surface |
| Dark2 | `#333231` | Deep bg / alternating sections |
| Font | Jost (Google Fonts) | Weights: 300, 400, 500, 700, 800 |
| Logo icon | Crossed scissors (×) + "20 25" flanking | SVG inline |
| Tagline | CUTS AND CARE | All-caps, wide tracking |
| Instagram | @laindustria.barber | |
| Booking URL | https://cut.yeasyapp.com/J0W7kF | Opens in new tab |

---

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (dark theme, brand tokens as CSS vars)
- **UI components:** shadcn/ui (Card, Button, Badge, Separator, Sheet for mobile nav)
- **Visual effects:** Magic UI (Particles, Typewriter, Shimmer, BorderBeam, Marquee, FadeUp)
- **Deliverable:** Single self-contained `index.html` bundled via Vite (`vite build --base ./ --outDir dist`)
- **Output path:** `Web - La Industria/index.html`

---

## Architecture

Single-page app (`App.tsx`) with 8 section components + shared layout:

```
src/
  components/
    Nav.tsx          — fixed navbar, blur bg, logo + links + CTA
    Hero.tsx         — full-height, particles bg, logo SVG, typewriter tagline, CTA
    Services.tsx     — grid of service cards
    Team.tsx         — barber cards with BorderBeam hover
    Booking.tsx      — centered CTA section linking to Yeasy
    Reviews.tsx      — Google reviews marquee
    Gallery.tsx      — asymmetric photo grid (real local photos)
    Contact.tsx      — info + footer
  lib/
    brand.ts         — brand color tokens, copy constants
  assets/
    01.png, 02.png, 03.png  — local photos from brand manual
  App.tsx
  main.tsx
  index.css
```

---

## Section Specs

### 1 · Nav
- Fixed top, `#333231` bg at 90% opacity + `backdrop-blur`
- Left: SVG logo (scissors × mark inline)
- Center/right: links `Servicios · Equipo · Reservas · Contacto` — Jost 500, uppercase, `#A4A4A4` → hover `#E9E4DB`
- CTA button: outline crema `Reservar` → scrolls to Booking section
- Mobile: hamburger → shadcn Sheet drawer

### 2 · Hero
- Full viewport height, bg `#333231`
- Magic UI `Particles` effect (low opacity, color `#7F7F7D`)
- Center: SVG logo (scissors + "20 25" + LA INDUSTRIA + CUTS AND CARE)
- Jost 800 hero text, crema
- Magic UI `Typewriter` for tagline: *"Tu corte, tu estilo. Sin rodeos."*
- Primary CTA: Button solid crema/carbón text → scrolls to Booking
- Secondary: link `Ver servicios ↓`
- Animated scroll indicator at bottom

### 3 · Servicios
- Bg `#414040`
- Section label: `01 · SERVICIOS` in Jost 500, `#7F7F7D`, wide tracking
- 2-col desktop / 1-col mobile grid of shadcn Cards
- Each card: service name (Jost 700, crema), price with Magic UI `Shimmer` effect, description (`#7F7F7D`)
- Hover: crema border transition
- Example content:
  - Corte · 20 € — Corte clásico o moderno adaptado a tu estilo
  - Corte + Barba · 32 € — Combinación completa con perfilado preciso
  - Afeitado Navaja · 22 € — Ritual clásico con toalla caliente
  - Arreglo Barba · 15 € — Perfilado y definición de barba
  - Degradado · 18 € — Fade limpio de cualquier nivel
  - Kids (−12) · 14 € — Corte para los más pequeños

### 4 · El Equipo
- Bg `#333231`
- Section label: `02 · EL EQUIPO`
- 3 barber cards: placeholder dark photo, name (Jost 800), specialty (`#A4A4A4`)
- Magic UI `BorderBeam` on card hover
- Example barbers: Carlos (Fundador · Fade & Classic), Sergio (Barba & Styling), Javi (Degradados & Diseño)

### 5 · Reservas
- Bg `#414040`
- Section label: `04 · RESERVAS`
- Centered: large title *"Reserva tu cita"*, subtitle *"Elige tu barber, tu hora. Sin esperas."*
- CTA button (large, Jost 800, solid crema bg, carbón text) with Magic UI `Shimmer`
- `href="https://cut.yeasyapp.com/J0W7kF"` + `target="_blank" rel="noopener noreferrer"`

### 6 · Reseñas Google
- Bg `#333231`
- Section label: `05 · RESEÑAS`
- Rating badge: ★★★★★ `5.0` (Jost 800, crema) + "Reseñas de Google"
- Magic UI `Marquee` (horizontal, auto-scroll, pause-on-hover)
- 6–8 shadcn review cards: avatar initial circle, name, 5 stars, comment text (`#A4A4A4`)
- Example reviews in brand voice: direct, genuine, no hyperbole

### 7 · Galería
- Bg `#414040`
- Section label: `03 · EL ESPACIO`
- Asymmetric 3-col grid using real photos `01.png`, `02.png`, `03.png`
- Staggered fade-in on scroll (Intersection Observer)
- Hover overlay: "La Industria · Madrid" in crema

### 8 · Contacto + Footer
- Bg `#333231`
- Two columns desktop: info left, decorative/map right
- Info: address placeholder (Madrid), hours Mon–Sat 10:00–20:00, phone placeholder, @laindustria.barber link
- Final CTA: "Reservar cita" button → Yeasy URL
- Footer: logo, `© 2025 La Industria · Todos los derechos reservados`

---

## Tailwind Config

```js
// tailwind.config.js
extend: {
  colors: {
    carbon:    '#414040',
    'gray-stone': '#7F7F7D',
    arena:     '#A4A4A4',
    cream:     '#E9E4DB',
    'cream-bg':'#F0ECE5',
    dark2:     '#333231',
  },
  fontFamily: {
    jost: ['Jost', 'sans-serif'],
  }
}
```

---

## Quality Checklist (Playwright)

- [ ] Page loads with 0 console errors
- [ ] Hero visible and CTA clickable
- [ ] Brand palette applied correctly
- [ ] Desktop screenshot (1280px)
- [ ] Mobile screenshot (390px)

---

## Constraints & Notes

- All copy in Spanish (brand voice: direct, no exclamation marks, no emoji)
- No colors outside the 6-token palette
- Jost is the only font
- Logo always SVG inline (no raster fallback needed for web)
- Photos (01.png, 02.png, 03.png) copied into project assets
- Services, team, reviews use placeholder content pending real data from client
