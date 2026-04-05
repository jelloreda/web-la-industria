# Web — La Industria

Sitio web para **La Industria**, construido con React, TypeScript y Tailwind CSS.

## Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS**
- **Playwright** (tests E2E)

## Secciones

- Hero
- Servicios
- Galería
- Reservas
- Reseñas
- Equipo
- Contacto

## Instalación

```bash
cd app
npm install
npm run dev
```

## Comandos

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run preview    # Preview del build
```

## Tests

```bash
npx playwright test          # Ejecutar todos los tests
npx playwright test --ui     # Modo interactivo
```

## Estructura

```
app/
  src/
    components/    — Componentes de secciones y UI
    assets/        — Imágenes y logos
    lib/           — Utilidades y tokens de marca
tests/             — Tests E2E con Playwright
```
