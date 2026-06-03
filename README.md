# Disco — MCAT Study Tracker

A premium, **100% local** MCAT study-tracking desktop app for macOS. No cloud, no
telemetry, no internet required — all data lives in a local SQLite database under
your macOS app-data directory.

Built with Electron + React + TypeScript, a frosted-glass dark/light UI, Framer
Motion animations, and an intelligent study engine (weak-topic detection, score
projection, readiness scoring, auto-generated study plans).

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Electron 33 (electron-vite bundler) |
| UI | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| State | Zustand |
| Charts | Recharts |
| Calendar | react-big-calendar (+ drag-and-drop addon) |
| Database | better-sqlite3 (main process only) |
| Auth | bcryptjs (local password hash in SQLite) |
| Icons | lucide-react |

## Architecture

The renderer is fully sandboxed (`contextIsolation: true`, `nodeIntegration: false`).
It never touches Node or the filesystem directly — every data operation goes:

```
renderer (window.api)  →  preload contextBridge  →  IPC  →  main process  →  better-sqlite3
```

```
src/
  shared/types.ts            # Domain model + the typed window.api contract (shared by main & renderer)
  main/                      # Electron main process
    index.ts                 # Window, menu, notifications, DB init
    menu.ts                  # Native macOS menu
    db/
      index.ts               # SQLite connection + all CRUD query helpers
      schema.ts              # Table definitions (idempotent)
      seed-content.ts        # MCAT content outline (all 4 sections)
      seed-quotes.ts         # Daily tips/quotes
    ipc/handlers.ts          # Every ipcMain.handle channel
    services/
      analytics.ts           # Streaks, weak topics, projections, readiness, dashboard + analytics bundles
      plan.ts                # Smart study-plan generator (phase + weak-section weighting)
  preload/
    index.ts                 # contextBridge → window.api (thin typed ipcRenderer.invoke wrapper)
    index.d.ts               # Global Window.api type
  renderer/
    index.html
    src/
      main.tsx               # React root + HashRouter
      App.tsx                # Auth gating + routes
      stores/                # Zustand: app (data), auth, theme, ui
      components/            # ui primitives, layout shell, reusable modals
      pages/                 # One file per screen (Dashboard, Sessions, ContentReview, …)
      lib/                   # utils, nav config
      data/                  # score conversion table, starter reference notes
      styles/                # globals.css (theme tokens + glassmorphism), calendar.css
```

### Theme system

All colors are CSS variables (space-separated RGB channels) defined in
`globals.css` under `:root/.dark` and `.light`. Tailwind maps tokens like
`bg-surface`, `text-content`, `bg-accent-gradient` to those variables, so toggling
the theme swaps one class on `<html>` with zero rebuild. Persisted in settings.

### Smart engine

- **Weak-topic engine** — aggregates question-log accuracy per topic; anything below
  60% (with ≥5 attempts) is flagged on the dashboard, in Content Review, and weighted
  more heavily by the plan generator.
- **Study plan** — from your test date it computes weeks remaining, splits them into
  content → practice → full-length → review phases, and distributes weekly hours per
  section by a weight combining accuracy gaps and content completion. Regenerate any
  time to re-weight to current performance.
- **Readiness & projection** — projects your next total from full-length trend and
  blends it with content completion and accuracy into a readiness %.

## Commands

```bash
npm install         # installs deps; postinstall rebuilds better-sqlite3 for Electron's ABI
npm run dev         # hot-reloading dev (main + preload + renderer)
npm run typecheck   # tsc for both node + web projects
npm run build       # production bundles into out/
npm run pack:mac    # build + package a macOS .dmg (arm64 + x64) into release/
```

> If `npm install` ever fails on a permission-broken global npm cache, install with an
> isolated cache: `npm install --cache /tmp/disco-npm-cache`.

## Packaging notes

`electron-builder.yml` targets macOS 13+, ships a universal-ish dmg (arm64 + x64),
unpacks the native `better-sqlite3` binary from the asar, and runs unsigned
(`hardenedRuntime: false`) for personal local use. To distribute more widely, add an
Apple Developer signing identity and enable notarization.

## Data location

The SQLite file lives at `~/Library/Application Support/Disco/disco.db`.
Use **Settings → Export JSON Backup** for a full snapshot.
