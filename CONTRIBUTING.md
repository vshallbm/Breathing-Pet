# Contributing to Breath Break

## Quick start

```bash
npm install
npm run dev          # Vite dev server with HMR
npm test             # Vitest unit tests (watch mode: npm run test:watch)
npm run build        # Production build → dist/
```

Load the extension in Chrome: **chrome://extensions → Load unpacked → select `dist/`**

## Project layout

```
src/
  background/     service worker, scheduler, digest, adaptive, ramp
  characters/     registry, emojis, seasonal drops, unlock logic
  content/        overlay, buddy, breathing engine, pacer, mascots
  audio/          catalog, player, ducker
  copy/           en / hi / es / pt locale bundles + getCopy()
  lib/            storage, guards, activity tracker, a11y helpers, crisis
  options/        options page
  popup/          toolbar popup
  onboarding/     first-run wizard
  patterns/       box-4-4-4-4, coherent-5-5
  premium/        subscription, paywall stub
  types.ts        shared types + DEFAULT_SETTINGS
tests/            vitest unit tests
tests/e2e/        Playwright smoke tests
```

## Code conventions

- **TypeScript strict mode** — no `any`, no unused locals/parameters.
- **No framework** — vanilla TS + Shadow DOM for the overlay.
- **No comments by default** — clear names over inline explanations. Add a comment only for non-obvious WHYs (invariants, workarounds, hidden constraints).
- **Tests alongside source** — unit tests in `tests/`, E2E in `tests/e2e/`.
- Imports use relative paths; no barrel `index.ts` re-exports unless essential.

## Adding a new locale

1. Create `src/copy/<lang>.ts` implementing `CopyKeys` (import the type from `en.ts`).
2. Register it in `src/copy/index.ts` under all relevant BCP-47 tags.
3. Add the `<option>` to `src/options/options.html`.
4. Add crisis resource(s) to `src/lib/crisis.ts` if the language maps to a covered country.
5. Extend `tests/copy.test.ts` with shape + pluralisation tests.

## Adding a new character

1. Add an SVG export to `src/content/mascots.ts`.
2. Add a `CharacterDef` entry to `src/characters/registry.ts`.
3. Add an emoji entry to `src/characters/emojis.ts`.
4. Assign a tier (`free` / `plus` / `premium`) and update `allUnlockedForTier()` in `src/premium/subscription.ts`.
5. If seasonal: add a `SeasonalDrop` entry in `src/characters/seasonal.ts`.

## Running E2E tests

E2E tests require a built extension and headed Chrome:

```bash
npm run build
npx playwright install chrome
npm run test:e2e
```

Set `CI=true` to enable single retry on flaky tests.

## Pull request checklist

- [ ] `npm test` passes locally
- [ ] `npx tsc --noEmit` reports no errors
- [ ] New user-visible strings added to **all** locale bundles (`en`, `hi`, `es`, `pt`)
- [ ] New premium-gated features guarded by `settings.isPremium || settings.lifetimeUnlocked`
- [ ] Deny-list updated if the feature touches overlay suppression logic
- [ ] CHANGELOG entry added under `[Unreleased]`
