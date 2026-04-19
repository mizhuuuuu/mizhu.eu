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

## Testing philosophy

Tests in `tests/data.test.ts` and `tests/contact.test.ts` guard only:

1. **Deploy-critical invariants** the CMS can't enforce — e.g. referenced media files exist on disk.
2. **Defense-in-depth for CMS-enforced rules** — e.g. string type, number range, Instagram handle format. Catches hand-edited JSON that bypasses the CMS.

Tests must NOT enforce rules Decap cannot validate (cross-field XOR, uniqueness across entries, cosmetic hygiene). The end-user can legitimately produce data that passes the CMS but fails such tests — blocking deploy with no recourse through the CMS. When frontend rendering handles a case gracefully, trust it instead of adding a test.