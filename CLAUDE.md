# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Birb is a Flappy-Bird remix that runs as a **Devvit app** (Reddit's developer platform). It has two halves that share types but run in different sandboxes:

- **Devvit blocks app** (`src/app/`, `src/main.tsx`) — server-side Reddit integration: custom post type, Redis persistence, scheduler jobs, triggers, payments, moderator menu actions.
- **Phaser game** (`src/game/`) — the actual gameplay, rendered inside a Devvit WebView (an iframe). Built separately by Vite into `webroot/`.

Node version is pinned to `20.17.0` (`.nvmrc`).

## Commands

```bash
npm run dev            # vite build --watch — rebuilds the Phaser game into webroot/ on change
npm run build          # one-off production build of the game (terser-minified)
npm run vite           # vite dev server for the game in isolation (no Devvit host)

npm run playtest       # devvit playtest reddibirds  — live-reload app on a test subreddit
npm run playtest:prod  # devvit playtest BirbGame
npm run logs           # devvit logs r/BirbGame

npm run upload         # devvit upload (no version bump)
npm run upload:patch   # devvit upload --bump patch
npm run upload:minor   # devvit upload --bump minor
npm run publish        # devvit publish
```

There is **no test suite and no lint script**. Formatting is Prettier (`.prettierrc`: tabs, width 4, no semicolons, single quotes, print width 120). Type-check via `tsc` if needed.

Typical dev loop: run `npm run dev` (watches/rebuilds the game into `webroot/`) **and** `npm run playtest` (uploads the Devvit app and serves the rebuilt `webroot/`) at the same time.

## The two-sandbox boundary (most important architecture)

The Phaser game cannot call Reddit/Redis APIs directly. All communication crosses the WebView iframe boundary via `postMessage`, and **all message payloads are typed in `src/shared/messages.ts`** — this is the contract between the two halves. When adding any client↔server data flow, update that file first.

Message flow:

- **Game → Devvit:** game code emits a local event on `globalEventEmitter` (`src/game/web/GlobalEventEmitter.ts`, an `eventemitter3` singleton). `WebviewEventManager` (`src/game/web/WebviewEventManager.ts`) listens for those, wraps them as typed messages, and `postMessage`s them to the parent window.
- **Devvit → Game:** `src/main.tsx` `handleMessage` switches on `ev.type` and replies via `postMessage`. Devvit wraps replies as `{ type: 'devvit-message', data: { message } }`; `WebviewEventManager.registerPostMessageListeners` unwraps that envelope and re-emits onto `globalEventEmitter` for the scenes to consume.

So a round trip is: scene → `globalEventEmitter.emit` → `WebviewEventManager` → `postMessage` → `main.tsx handleMessage` → Redis → `postMessage` → `WebviewEventManager` → `globalEventEmitter.emit` → scene.

`main.tsx` also pushes `updateAppData` every 10s via `useInterval` (online-player heartbeat + fresh leaderboard/stats).

## Devvit app side (`src/app/`, `src/main.tsx`)

`src/main.tsx` is the entry point: it `Devvit.configure`s redis + redditAPI, **imports every job/trigger/block file for their side effects** (each registers itself via `Devvit.addSchedulerJob` / `addTrigger` / `addMenuItem`), and defines the custom post type whose `render` returns `<SplashScreen>` and mounts the WebView.

- `services/RedisService.ts` — the single data-access layer. All Redis keys are namespaced `community:${subredditId}:*` (highscores as a sorted set, attempts/score as hashes). `getAppData()` aggregates everything the client needs into one `AppData` object. There is no global/cross-community data yet (it's stubbed empty).
- `jobs/` — scheduler jobs registered with `Devvit.addSchedulerJob`. Triggered by name (e.g. `runJob({ name: 'NEW_HIGHSCORE_COMMENT', ... })`). Includes daily reset, highscore/first-player sticky comments, welcome DMs, and Birb Club membership flair management.
- `triggers/appInstall.ts` — on install, seeds the daily and registers the recurring cron jobs (`reset_daily` and `MANAGE_MEMBERSHIP_FLAIRS`, both `0 0 * * *`). It cancels all pre-existing jobs first to avoid duplicates.
- `config/` — Redis key constants and TTLs (`redis.config.ts`, `daily.config.ts`). `settings/` — the moderator-configurable app settings (world/player/pipe selection) read back via `context.settings.getAll`.
- Payments: `src/paymentsHandler.ts` (`addPaymentHandler` fulfill/refund) + `src/products.json` (the SKU catalog). The only product is the 30-day "Birb Club Member" flair. Fulfillment schedules a `SET_FLAIR` job; refund removes the flair. Note the in-code comment that order status is always reported `PAID`.

## Phaser game side (`src/game/`)

- Entry `src/game/index.ts` registers WebView events then `new Game(gameConfig)`. `game.config.ts` defines arcade physics (gravity y=990) and the scene order: `Boot → Preloader → Menu → Game → GameOver`.
- `scenes/` — one file per scene. `Game.ts` holds the run loop, scrolling, scoring, and the escalating-difficulty "twists" (rain, moving/flickering/invisible pipes, shrink, lights-out, earthquakes). `Menu.ts` + `objects/menu/*` render leaderboards/stats/daily/membership from `AppData`.
- `objects/` — game entities (`Player`, `PipePair`, `MagoText` bitmap-font text) and the menu UI widgets.
- `config/` — gameplay tuning (`pipe.config.ts`, `ranks.config.ts`, etc.). `weather/Rain.ts` and `util/` (rank math, DOM background swap) round it out.
- Assets live in `src/game/public/assets/` (Vite `publicDir`); they are copied to `webroot/` on build.

## Build specifics (`vite.config.ts`)

Vite `root` is `src/game/` (not the repo root) and `outDir` is `webroot/` with `emptyOutDir: true` — **the build wipes and regenerates `webroot/`**, which is gitignored. Phaser is split into its own manual chunk. `tsconfig.json` configures JSX for Devvit (`Devvit.createElement` / `Devvit.Fragment`), so `.tsx` in `src/app/` is Devvit Blocks, not React.

## Conventions

- Logging goes through `src/shared/logger.ts` (`devvitLogger` for app side, `webviewLogger` for game side) — not raw `console.*`.
- Versioning: `devvit.yaml` carries the app version (bumped by `upload:patch`/`upload:minor`); `package.json` version is unused (`0.0.0`). The README changelog is maintained by hand.
