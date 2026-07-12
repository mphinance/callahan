# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repo.

## What this is

"Are We There Yet?" is a single-file, zero-backend PWA for one day or a whole
trip. All app logic lives in `index.html`; everything specific to a given event
lives in one `event.json`. Swap that file and you have a different event. The
app runs fully offline once installed (service worker + cached tiles), so it
works in a field or national park with no signal.

Origin: a fork of a one-off Cedar Point trip app ("Operation Callahan"),
generalized into a reusable day/trip kit.

## Architecture

- **`index.html`** is the entire app: HTML shell, all CSS in one `<style>`, and
  all JS in one `<script>`. No framework, no build step, no bundler. Plain ES5-
  flavored JS (`var`, `function`, no modules). It fetches `event.json` at load,
  normalizes single-day and multi-day shapes into one internal form, and renders
  four tabs: Schedule, Map, Kids, Info.
- **`event.json`** is the only file you edit per event. Full schema in
  `SPEC.md`. Never hardcode event specifics into `index.html`; add a field and
  drive it from data instead.
- **`sw.js`** is the service worker. It caches the shell, `event.json`, and any
  map tiles the user saves offline. **Bump the `CACHE` version (e.g.
  `daykit-vN`) whenever you change `index.html`, `event.json`, or other cached
  assets**, or installed clients keep serving the old version.
- **`manifest.json`** is PWA metadata. **`gen-icons.js`** regenerates icons and
  **`screenshots.js`** regenerates the `docs/` showcase images, both via
  Playwright.
- **`samples/vacation.json`** is a 3-day multi-day example kept in sync with the
  schema. **`NEW-EVENT.md`** is the human/Claude workflow for turning photos of
  a schedule or map into a new `event.json`. **`SPEC.md`** is the field-by-field
  schema reference.

Third-party runtime deps are loaded from CDNs at runtime (Leaflet 1.9.4 +
OpenStreetMap tiles for the map, Open-Meteo for weather, no API keys). The only
npm dependency is Playwright, used solely for icon and screenshot generation.

## Conventions

- **No em dashes anywhere** (code, comments, JSON strings, docs). Use periods,
  commas, or "and". This is a hard style rule inherited from the workspace.
- Match the surrounding style in `index.html`: ES5 idioms, terse helpers,
  `esc()` all user/data-derived strings before putting them in HTML.
- Keep features **data-driven and backward compatible**. New `event.json`
  fields must be optional so existing files keep working, and the app should
  render nothing (not error) when a field is absent. See `normalizeLists()` and
  the `bring`/`lists`/`notes` blocks in `renderInfo()` for the pattern.
- Per-item UI state (checklists) persists to `localStorage` under a
  `daykit:<event.id>:<feature>` key namespace.

## Data model quick reference

`event.json` is single-day (top-level `date` + `schedule`) or multi-day
(`days[]`). Both normalize to the same internal shape. Key optional fields:
`title`, `subtitle`, `timezone` (IANA; schedule times are wall-clock in this
zone), `theme`, `location`, `team`, `places[]` (map pins, `kind` sets color),
`schedule[]` items (`start`/`end`/`title`/`place`), `bring[]` (packing
checklist), `lists[]` (trip-goal checklists: `must` and `stretch` tones),
`notes[]`, `closingNote`. See `SPEC.md` for the authoritative reference.

## Running and verifying

Serve statically (geolocation needs localhost or HTTPS, not `file://`):

```
npx serve .            # or: python -m http.server 8000
```

To preview the multi-day sample: `cp samples/vacation.json event.json` (restore
with git afterward).

To verify a UI change, drive the app headless with Playwright and observe the
real rendered result rather than trusting the code alone. The bundled Chromium
lives at `/opt/pw-browsers/chromium`; pass it as `executablePath` (or set
`PWEXEC=/opt/pw-browsers/chromium` for `screenshots.js`). External resources
(OSM tiles, Open-Meteo) may be blocked in the sandbox, so the Map tab can render
blank here; the other tabs render fully offline.

Regenerate showcase images after a visible change:

```
PWEXEC=/opt/pw-browsers/chromium npm run shots   # writes docs/screenshot-*.png
```

The Map shot needs network for tiles; skip committing a blank one when offline.

## Deploy

GitHub Pages from `main`, folder `/ (root)`. `.nojekyll` must stay so `assets/`
serves. Pages is HTTPS, so GPS, reminders, and installability all work with no
backend.

## When you change things

1. Keep `index.html` generic and data-driven.
2. If you add an `event.json` field: document it in `SPEC.md`, add a sample to
   `event.json` and `samples/vacation.json`, mention it in `README.md`, and add
   a prompt hint in `NEW-EVENT.md` so generated files include it.
3. Bump `CACHE` in `sw.js`.
4. Regenerate `docs/` screenshots if the change is visible.
