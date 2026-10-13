# VEX Scout

An offline-first scouting app for **VEX V5 Robotics Competition (V5RC)** and **VEX U**, built as an installable Progressive Web App. It combines the team/event data and statistics you'd find in tools like VRC RoboScout with the match tools of V5RC Hub, and is designed for phones at events with bad Wi-Fi.

> Not affiliated with VEX Robotics or the REC Foundation. Game rules belong to their owners; this app links to the official Game Manual instead of copying it.

## Features

**Scouting & data**
- Team lookup: team info, season history, events attended, awards, skills scores, win/loss record
- Event search by season, level, grade, country and region (including non-US events)
- Event pages: divisions, teams, match lists (field names and local times for unplayed matches), rankings, skills standings, awards
- Team stats computed in the app: **OPR, DPR and CCWM** by least squares
- **Match predictions** with win probability, optionally blended with each team's earlier events
- **Pre-match scouting page** showing all four teams side by side
- **Excellence Award** eligibility calculator
- **World Skills** and **TrueSkill** leaderboards (TrueSkill is computed in-app, labeled as an approximation)
- Favorite teams and events on the home screen
- Notes per team and per match with tags, plus a structured scouting form (auton reliability, scoring, driver skill, endgame, 1–5 rating)
- CSV export of the scouting spreadsheet (stats + notes) per division or event; JSON export/import of notes to share with teammates
- Light/dark/system theme, accent colors, minimalist mode; V5RC HS / V5RC MS / VEX U modes with a season picker

**Match tools**
- Practice timer: 15 s autonomous + 1:45 driver (VEX U: 30 s + 1:30, Skills: 1:00), drift-resistant, generated buzzers, keeps the screen awake
- Score calculators for the 2026-27 game **Override**: V5RC Match, VEX U Match and Skills, with an Autonomous Win Point checklist and a saved-runs history with a chart for skills

## Screenshots

_Coming soon._ <!-- Add screenshots of: home, event matches, pre-match page, score calculator, timer (light + dark). -->

| Home | Event | Pre-match | Calculator | Timer |
|------|-------|-----------|------------|-------|
| _tbd_ | _tbd_ | _tbd_ | _tbd_ | _tbd_ |

## Quick start

Requires Node.js 20+ and a VEX Events API key (see below).

```bash
npm install
cp .env.example .env   # then paste your key into VEX_API_KEY
npm run dev
```

Open http://localhost:5173. Anything you have opened once keeps working offline.

Other scripts:

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build into `dist/` (includes the service worker) |
| `npm run preview` | Serve the production build locally (to try the PWA/offline behavior) |
| `npm run check` | All of the above in sequence |
| `npm run icons` | Regenerate the PWA icons |

## Getting a VEX Events API key

1. Create an account at [events.vex.com](https://events.vex.com).
2. Request API access at <https://events.vex.com/api/v2/accessRequest/create>.
3. Once approved, create a token. It is a Bearer token for `https://events.vex.com/api/v2`.

**The key never reaches the browser.** The app calls its own serverless function at `/api/vex/...`, which adds the `Authorization: Bearer …` header on the server, forwards the request, and caches responses briefly.

## Environment variables

Copy `.env.example` to `.env` for local use. On Vercel, set them in **Project → Settings → Environment Variables**.

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VEX_API_KEY` | server (Vercel function) | for live data | VEX Events API token. Never prefix with `VITE_`. |
| `VEX_API_BASE` | server | no | Defaults to `https://events.vex.com/api/v2` |
| `VEX_WORLD_SKILLS_URL` | server | no | Override the World Skills feed URL template (`{season}`, `{grade}`) |

## Deploying (Vercel)

1. Push this repo to GitHub and import it in Vercel (framework preset **Vite**; `vercel.json` already sets the build command and output directory).
2. Add `VEX_API_KEY` as an environment variable (Production, Preview and Development).
3. Deploy. Static files are served from `dist/`, `api/vex.ts` and `api/world-skills.ts` become serverless functions. `vercel.json` rewrites `/api/vex/<path>` to `api/vex.ts` (as `?__path=<path>`), because Vercel doesn't reliably route multi-segment catch-all files for non-Next.js functions. All other paths rewrite to the SPA.
4. Open the site on your phone and use **Add to Home Screen** / **Install app**.

Locally, `npm run dev` also serves `/api/*`: a dev-only Vite plugin (`scripts/devApiPlugin.ts`) runs the same function files and reads `VEX_API_KEY` from `.env` on the server side. So with a `.env` in place, `npm run dev` gives you live data. `npx vercel dev` works too.

## Architecture

```
api/                        Vercel serverless functions (server-only; holds the API key)
  vex.ts                    GET proxy → VEX Events API, adds auth, 60 s cache, path sanitising
  world-skills.ts           World Skills standings proxy (not part of the documented API)
  _lib/proxy.ts             shared, unit-tested proxy logic
src/
  app/                      router, layout, providers, offline/update banners
  components/               UI primitives (Button, Tabs, Fields, …), icons, QueryView, LastUpdated
  data/
    DataSource.ts           the interface every screen uses
    types.ts                domain model, independent of the API wire format
    live/                   LiveDataSource, zod schemas, mappers, endpoint contract
    db.ts                   Dexie (IndexedDB) schema
    cache.ts                network-first fetch with IndexedDB fallback
    queries.ts              React Query hooks
  features/                 one folder per feature (teams, events, matches, stats, notes, export,
                            scoring, timer, excellence, leaderboards, settings, …)
  lib/stats/                linear algebra, OPR/DPR/CCWM, predictions, TrueSkill (all tested)
  sync/SyncAdapter.ts       stub for future cloud sync (not implemented)
```

**Data flow.** Screens call React Query hooks → the `DataSource` (`LiveDataSource`). Responses are validated with zod, mapped to domain types, and stored in IndexedDB, so previously viewed events and teams work offline. Each view shows when its data was fetched and has a Refresh button. The Workbox service worker precaches the app shell and also keeps a network-first runtime cache of `/api/*` responses.

**State.** Server data lives in React Query and IndexedDB. Settings live in a small persisted Zustand store. Notes, scouting forms, favorites and skills runs live in Dexie tables.

**Sync-ready records.** Every user record has `id` (UUID), `updatedAt`, a `deleted` tombstone and `deviceId`. JSON import merges per record with last-write-wins, so the same logic can back a real sync service later. See [`src/sync/SyncAdapter.ts`](src/sync/SyncAdapter.ts).

**Stats.**
- OPR, DPR and CCWM solve the least-squares normal equations: Cholesky first, with pivoted Gaussian elimination as a fallback.
- Predictions model the score margin as normal. The mean averages the OPR and CCWM differences. σ is the in-division prediction error with a degrees-of-freedom correction.
- TrueSkill uses the closed-form two-team update over match history.

## API contract status

`src/data/live/endpoints.ts` and `schemas.ts` were checked against the official OpenAPI spec (**Public VEX Events API, v1.0.21**): the base URL, Bearer auth, pagination (`page`/`per_page`, maximum 250), every path and parameter, and the round codes. Program ids are looked up from `GET /programs`. Not covered by the spec:
- **World Skills standings** have no API endpoint. `api/world-skills.ts` proxies the undocumented public feed behind the events.vex.com standings page (`/api/seasons/{id}/skills`). It was checked working on 2026-10-12, and the URL is configurable in case it changes.
- **Rate limits** aren't documented. The proxy caches for 60 s and passes `429` responses through.
- **CORS** doesn't matter because the browser only ever talks to our own origin.

## Game rules (Override 2026-27)

All point values and durations live in typed config files, so updating for a new manual means editing one file:

- [`src/features/scoring/rules/v5rc.ts`](src/features/scoring/rules/v5rc.ts): V5RC match
- [`src/features/scoring/rules/vexu.ts`](src/features/scoring/rules/vexu.ts): VEX U match (Section 6 modifications)
- [`src/features/scoring/rules/skills.ts`](src/features/scoring/rules/skills.ts): V5RC and VEX U Robot Skills
- [`src/features/scoring/rules/manual.ts`](src/features/scoring/rules/manual.ts): manual version (shown in the UI as "Rules: Game Manual v2.1") and field layout

Values were read from **Game Manual v2.1** (released 2026-10-08, in force from 2026-10-15). Its changelog lists only wording changes from v2.0 (around the new "Pin Half" term), no point-value changes. Things worth knowing:
- Only **visible** Pin Halves of Placed Pins score. Halves inside a Goal or the opaque half of a Cup don't, and Cups score nothing directly.
- Autonomous Bonus: 12 points, **6 each on a tie (including 0–0)**. A violation gives it to the opponent; if both alliances violate, nobody gets it.
- V5RC excludes Midfield robots and Midfield yellow ownership from the autonomous score. VEX U includes them.
- AWP thresholds: standard 6 halves / 2 goals, Worlds-qualifying 7 / 3, VEX U 12 / 4 plus a robot in the Midfield.
- Skills: 1:00 runs, colored halves score only in their own color's quadrant or the Midfield Goal, combined score = best programming + best driver.
- One item is marked **UNVERIFIED** in the config and the UI: the manual doesn't say in text that red Quadrants are on red's side of the Autonomous Line. Only the AWP checklist depends on it.
- The **Excellence Award** thresholds come from the Guide to Judging, not the manual, and are marked UNVERIFIED in `src/features/excellence/rules.ts`.

## Testing

Vitest covers:
- the linear algebra and OPR/DPR/CCWM, against a hand-checked 4-team example
- predictions, the normal CDF and TrueSkill (matches the published reference update)
- all three score calculators, including the manual's own Figure SC5 example
- the timer state machine
- CSV export (quoting and formula-injection safety), the scouting sheet, and the JSON bundle merge
- the API proxy and the live API mappers, using spec-shaped payloads

CI runs typecheck, lint, tests and build on every push ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Accessibility

- Keyboard navigable: skip link, arrow-key tabs, visible focus rings.
- Text meets WCAG AA contrast in both themes.
- Alliance colors always come with "Red"/"Blue" labels, results with Win/Loss text, and chart series with shapes plus a table view, so color never carries meaning on its own.

## Roadmap

- **Cloud sync** of notes between teammates (the data model is already sync-ready; implement `SyncAdapter`)
- **Notifications** when a favorite team's match is coming up
- **Home-screen widgets** (next match, live rank) where platforms allow
- Screenshots and a Lighthouse report in this README
