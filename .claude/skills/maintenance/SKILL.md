---
name: maintenance
description: Run a dependency and toolchain maintenance pass on this repo — updating Astro, Decap CMS, wrangler, Node, or GitHub Actions. Use whenever the user wants to update or upgrade dependencies, refresh the toolchain, pin a Node version, or asks "what's outdated" / "anything need updating" / "let's do some maintenance", especially after being away from the project for a while. Also use before any framework major upgrade, since it carries the baseline-diff procedure that catches silent rendering regressions the test suite cannot see.
---

# Maintenance pass

Dependency and toolchain upkeep across two deploy targets: the Astro site
(GitHub Pages) and the OAuth Worker in `worker/`. Read `.claude/CLAUDE.md` first —
this skill only covers what that file doesn't.

## Order

Toolchain before dependencies, and each major alone in its own commit. A framework
major mixed with other changes is unbisectable when the site renders subtly wrong.

1. pnpm / Node / `.node-version`
2. GitHub Actions (SHA-pinned — see the CLAUDE.md convention)
3. Low-risk minors (Decap CMS)
4. Framework majors, one per commit (Astro)
5. `worker/` — its own `package.json` and lockfile

Match the commit style already in `git log`: short imperative subject, one compact
paragraph wrapped near 72 columns explaining *why*, no bullet lists.

## Gates — run before AND after every commit

The "before" run matters as much as the "after". Without it you can't tell whether
a failure is yours or was already there, and some before-runs are *expected* to
fail — that failure is the thing being fixed.

- **Site**: `pnpm install` → `pnpm run test` → `pnpm run build`, all exit 0
- **Worker**: from `worker/`, `pnpm install && pnpm wrangler deploy --dry-run`
- **Framework major**: `cp -r dist /tmp/dist-before` first, then `diff -r` after and
  account for *every* changed byte. Don't stop at "looks fine" — trace each
  difference to a cause, or you'll ship a rendering change you can't explain.

## Gotchas that will cost you time

**"Latest" is not npm's latest.** `~/.npmrc` sets `min-release-age=7`, so pnpm
refuses anything published within the last week. `pnpm add pkg@latest` installs an
older version and prints "(x.y.z is available)". `pnpm outdated` reports the newest
*installable* version; `npm view pkg version` reports the newest *published* one.
They disagree by design — trust pnpm. Confirm with `npm view <pkg> time --json`
before concluding something is broken.

**Two workspaces, deliberately.** Root and `worker/` each have a
`pnpm-workspace.yaml`. The one in `worker/` exists solely to stop pnpm walking up
and adopting the repo root as the Worker's workspace — without it, `pnpm install`
there installs the *site's* dependencies and `wrangler` becomes unresolvable, with
no error explaining why. Verify with `pnpm list --depth 0` inside `worker/`: it must
report `mizhu-cms-oauth`, not `mizhu.eu`. Never delete it.

**pnpm blocks dependency build scripts.** `strictDepBuilds` defaults to true, so a
new dependency carrying an install script fails `pnpm install` outright and appends
a placeholder line to `pnpm-workspace.yaml`. Resolve it to a real boolean. Default
to `false` — prebuilt binaries in optional deps cover these — except `workerd`,
which needs `true` to link the Cloudflare runtime.

**`@types/node` must track `.node-version`.** `tests/tooling.test.ts` fails
otherwise. And "Node LTS" means the line marked `lts: <codename>` in
`https://nodejs.org/dist/index.json` — not the highest version number, which is
usually still Current.

**Trailing slashes.** `trailingSlash: 'always'`. Canonical tags,
`public/sitemap.xml`, and internal nav links all use `/vfx/`; file links
(`/favicon.svg`, `/fonts/*.woff2`, `/admin/config.yml`) must not. Verify against the
live site, not just locally — GitHub Pages 301s the slashless form, so a canonical
without the slash points at a redirect back to itself.

**Astro upgrades.** Read the official upgrade guide through the Astro docs MCP and
assess each breaking change against this repo specifically rather than generically —
most won't apply, since there are no integrations, no markdown, and no experimental
flags.

**`astro dev` and `astro preview` detach.** Both fork a background process, print a
pid, and return immediately — `&` is pointless and `kill $!` won't stop them, since
that pid has already exited. Use `astro dev stop` / `astro preview stop`, and check
`status` before trusting any result. This matters more than it sounds: a forgotten
server keeps serving a *stale build*, and if its port is taken the new one quietly
moves to the next one — so curling 4321 can silently hit the previous version and
invalidate a whole round of verification.

## The tests do not render anything

`pnpm run test` is data validation — referenced media exists on disk, year ranges,
Instagram handle formats, `@types/node` alignment. Nothing executes browser JS or
renders a page. A green run says the content is well-formed, not that the site works.

After anything touching Astro or CSS, check these by hand:

- hover a card → video preview swaps in; click → modal with title/year/credits;
  backdrop click and × both close it
- burger menu opens; all three nav links land without a redirect
- `/contact/` → clicking the email copies it and flips to "copied!"
- narrow the window → grid collapses to one column
- `/admin/` → Decap loads and all three collections render their fields
  (run `pnpm run cms` alongside `pnpm run dev`; `local_backend: true` needs it)

## Deploying

**Site**: push to `main`; Actions builds and deploys. Confirm the run is green —
changes to the CI toolchain itself can only be proven there.

**Worker**: `cd worker && pnpm wrangler deploy`. Independent of the site push and
outward-facing — it touches live OAuth, so confirm before running it. Verify after,
using the `base_url` from `public/admin/config.yml`:

```bash
curl -sI --max-redirs 0 <worker-url>/auth
```

Expect a 302 to github.com carrying `scope=public_repo` (never `repo`) and a
`Set-Cookie: oauth_state`. `wrangler rollback` reverts. The full login round-trip
can only be confirmed by actually signing in at `/admin/`.
