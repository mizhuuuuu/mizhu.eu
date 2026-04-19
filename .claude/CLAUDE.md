# Portfolio VFX - Claude Context

## Project Overview

Static portfolio website for a video director & VFX artist. Built with Astro, no integrations, minimal dependencies.

## Architecture

Two separate deploy targets:

- **Site** — Astro static build, deployed to GitHub Pages. Everything under `src/`, `public/`, and the root `package.json`.
- **OAuth proxy** — standalone Cloudflare Worker in `worker/` with its own `package.json` and `pnpm-lock.yaml`. Handles the GitHub OAuth token exchange for Decap CMS (GitHub's OAuth requires a server-side step that can't run in the browser). Deployed via `pnpm wrangler deploy` from inside `worker/`. Do not run the site's tests or build over `worker/`.

The Worker deliberately requests `scope=public_repo` (the narrower scope) because the site repo is public. Do not upgrade to `repo` — the broader scope isn't needed.

## Tech Stack

- **Framework**: Astro 5 (static output, no SSR)
- **Language**: TypeScript (strict)
- **Styling**: Vanilla CSS (no Tailwind)
- **CMS**: JSON files + Decap CMS admin UI
- **Hosting**: GitHub Pages (site), Cloudflare Workers (OAuth proxy)
- **CI/CD**: GitHub Actions

## Commands

Site (run from repo root):

```bash
pnpm run dev      # Start dev server (localhost:4321)
pnpm run build    # Build to dist/
pnpm run preview  # Preview production build
pnpm run test     # Run data/asset validation tests
pnpm run cms      # Start the Decap local backend for /admin/ dev
```

OAuth proxy Worker (run from `worker/`):

```bash
pnpm wrangler deploy --dry-run   # Validate the bundle without uploading
pnpm wrangler deploy             # Ship to Cloudflare
pnpm wrangler secret put <NAME>  # Set a Worker secret (e.g. GITHUB_CLIENT_SECRET)
```

## Conventions

- **No integrations**: Keep Astro vanilla, no React/Vue/Tailwind
- **No external JS**: All JavaScript in the Astro site is inline in Astro components. (The Cloudflare Worker in `worker/` is the intentional exception — it's OAuth infrastructure, not part of the rendered site.)
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