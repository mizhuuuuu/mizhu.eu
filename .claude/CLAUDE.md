# Portfolio VFX - Claude Context

## Project Overview

Static portfolio website for a video director & VFX artist. Built with Astro, no integrations, minimal dependencies.

## Tech Stack

- **Framework**: Astro 5 (static output, no SSR)
- **Language**: TypeScript (strict)
- **Styling**: Vanilla CSS (no Tailwind)
- **CMS**: JSON files + Decap CMS admin UI
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Commands

```bash
pnpm run dev      # Start dev server (localhost:4321)
pnpm run build    # Build to dist/
pnpm run preview  # Preview production build
```

## Conventions

- **No integrations**: Keep Astro vanilla, no React/Vue/Tailwind
- **No external JS**: All JavaScript is inline in Astro components
- **Static only**: No SSR, no API routes
- **Minimal deps**: Only Astro as dependency
- **CSS variables**: All colors/spacing defined in :root in global.css
- **Mobile-first**: Responsive design, grid adapts to screen size
- **Sitemap**: When adding or removing pages in `src/pages/`, update `public/sitemap.xml` accordingly
- **Content in JSON**: All content/data lives in `src/data/*.json`, never hardcoded in pages
- **Site URL**: Defined in `astro.config.mjs` (`site` option), accessible via `Astro.site`
- **Shared components**: Reusable UI lives in `src/components/`, pages pass page-specific props (e.g. alt text)
- **Page titles**: All uppercase format `MIZHU – DESCRIPTION`