# Changelog

## [1.0.0] — Phase 13 — Release-ready

### Added
- `tests/adaptive.test.ts` — `applyAdaptiveFactor` (7 cases: reduction factors, minimum clamp, rounding) + `getAdaptiveFactor` via chrome.storage stub (heavy/medium/light/yesterday/error)
- `tests/storage.test.ts` — `getActiveScrollSeconds` (no data, stale date, today), `addActiveScrollSeconds` (accumulates, resets on new day), `getDismissalState`, `recordDismissal` (window logic, autoSnooze trigger, count reset)
- `tests/crisis.test.ts` — all 17 covered locales, navigator.language fallback, default for unknown locales
- Crisis resources expanded: Spain (`es-ES`), Portugal (`pt-PT`), Argentina (`es-AR`), Japan (`ja-JP`), South Korea (`ko-KR`)
- `CONTRIBUTING.md` — quick-start, layout map, code conventions, step-by-step guides for new locale / new character, E2E instructions, PR checklist
- Version bumped to `1.0.0` in both `package.json` and `vite.config.ts`

---

## [Unreleased] — Phase 12 complete

### Added (Phase 12 — Production hardening)
- Content Security Policy in manifest: `script-src 'self'; object-src 'none'` on all extension pages
- `src/assets/icons/icon-48.png` added to `web_accessible_resources` so notification icon resolves at runtime
- License key attempt rate-limiting in options page: max 5 attempts per session; button disabled and message shown on exhaustion
- Overlay error boundary: `show()` delegates to `_show()` in a try/catch; any uncaught error calls `hide()` so a broken backdrop can never get stuck on screen

### Added (Phase 11 — Playwright E2E scaffold)
- `playwright.config.ts` with `--load-extension` launch args; headed Chromium only (required for MV3)
- `tests/e2e/helpers.ts` — `getExtensionId`, `openPopup`, `openOptions` utilities
- `tests/e2e/extension.spec.ts` — 4 smoke tests: extension loads + popup renders, options sections visible, theme save persists after reload, onboarding skip-demo navigation
- `test:e2e` and `test:e2e:ui` npm scripts
- E2E job in CI: runs after `test` on `main` pushes; builds extension first; uploads Playwright report on failure

### Added (Phase 10 — Popup polish)
- `src/characters/emojis.ts` — `CHAR_EMOJIS` and `getCharEmoji()` shared between popup and options (eliminates duplication)
- Popup logo now reflects the user's chosen character (reads `character` from `GET_STATUS` response)
- Streak badge below title: shows today's session count in accent-coloured pill (hidden when 0)
- Next-break countdown: "in X min / Xh Xm" derived from `nextAlarmMs` in status response
- `GET_STATUS` response extended with `totalSessions`, `character`, and `nextAlarmMs` (reads live `chrome.alarms` schedule)
- `STATUS_RESPONSE` message type updated to carry new fields
- Toggle label now updates to On/Off when toggled (was always "Enable")
- `aria-live="polite"` on status text; `aria-label` on the toggle switch

---

### Added (Phase 9 — CI & release readiness)
- GitHub Actions CI workflow: type-check → unit tests → `vite build` on every push/PR to `main`/`dev`
- Coverage job on `main` pushes: runs `vitest --coverage`, uploads `lcov` report as artifact
- `dist/` uploaded as build artifact (7-day retention) for manual QA installs
- Vitest coverage thresholds (60 % lines/functions/statements, 55 % branches) to catch regressions
- Coverage exclusions for UI entry-points (popup, options, onboarding) — those are E2E targets

---

## [0.8.0] — Phase 8 — Localisation expansion

### Added
- Spanish (es-ES / es-MX / es-419) copy bundle — all overlay, popup, options, and mood keys
- Portuguese (pt-BR / pt-PT) copy bundle — same full key set
- Both locales registered in `src/copy/index.ts` with regional-variant aliases
- Language selector in options page now includes Español and Português options
- Copy tests extended to validate shape and pluralisation rules for es and pt bundles

---

## [0.7.0] — Phase 7 — Test coverage expansion

### Added
- `tests/seasonal.test.ts` — 15 cases covering `getActiveSeasonalDrops` (boundary dates, year-wrap, season isolation) and `applySeasonalDrops` (new drops, deduplication, array preservation)
- `tests/unlocks.test.ts` — `checkMilestone` (all milestones, between-milestones, edge cases) and `shouldUnlockDog` threshold logic
- `tests/subscription.test.ts` — `validateKeyFormat` (valid/invalid format variants, case insensitivity, whitespace), `applyLicenseKey` (plus/premium tier assignment, invalid rejection), `allUnlockedForTier` (character counts per tier, subset relationships)
- `tests/guards-extended.test.ts` — `isUserTyping` (input/textarea/contenteditable focus), `isFullscreen` (fullscreenElement stub), `shouldSuppressOverlay` end-to-end with deny-list hostname and path
- `tests/copy.test.ts` — `getCopy` locale routing and fallback, English/Hindi/Spanish/Portuguese shape and pluralisation rules

---

## [0.6.0] — Phase 6 — Monetisation & polish

### Added
- License key flow: `BB-XXXX-XXXX-XXXX` format; `BB-P` prefix grants Premium, others grant Plus
- Premium status display in options page — hides license form when already unlocked
- Mood history chart in options: 30-day bar chart coloured by most-common mood per day
- Weekly digest notification: `chrome.alarms` 7-day period, reports sessions this week, total, top mood
- Seasonal character auto-drops: zen_frog (spring), otter (summer), red_panda (autumn), penguin (winter)
- Custom mascot name input in options; name displayed below mascot during sessions
- `voice_custom` audio mode: Premium users can supply intro/outro audio URLs; played by session controller
- `voice_savage` and `voice_custom` modes properly gated behind `isPremium` check in options
- `APPLY_LICENSE` and `OPEN_CHECKOUT` message types wired through service worker
- Centralised mascot SVG system (`src/content/mascots.ts`) — single source of truth for all 9 character SVGs
- `bb-mascot-name` CSS in overlay for custom name display

### Changed
- `isVoiceMode()` in catalog now includes `voice_savage` and `voice_custom`
- `session-controller.ts` loads `customLines` from storage; plays custom URLs for `voice_custom` mode
- Options audio section shows custom voice URL inputs only when `voice_custom` is selected

---

## [0.5.0] — Phase 5 — Body-double, adaptive scheduler, pet interaction

### Added
- Body-double / Focus mode: corner Pomodoro mascot lives on-screen during 25/5 blocks and triggers a breath break at each rest
- "Pet your character" interaction: tap/click the mascot during a session for a randomised heart-burst animation
- Adaptive interval scheduling: interval scales with today's scroll activity (0.6× heavy, 0.8× medium, 1.0× light)
- Activity tracking flushed to `chrome.storage.local` every 30 s from content script

### Changed
- Service worker broadcasts `BUDDY_START` / `BUDDY_STOP` to all tabs on buddy mode toggle
- Options save sends `SETTINGS_UPDATED` to service worker for immediate effect
- Free tier capped at 3 target sites; paywall stub shown on 4th attempt

### Fixed
- Character unlock: only Sleepy Dog unlocks at 7 sessions; all other non-cat characters are subscription-gated

---

## [0.4.0] — Phase 4 — Onboarding, locale, accessibility

### Added
- Onboarding flow: 4-screen wizard (demo → pitch → quiz → done) with live breathing demo
- Hindi (hi-IN) localisation for all overlay, session, popup, and options copy
- Overlay reads locale from storage at show-time; session controller reads locale for phase labels
- Country-aware crisis resource link in options footer (US, UK, CA, AU, NZ, IN, IE, ZA, DE, FR, BR, MX)
- Privacy policy page bundled with the extension (`src/privacy/privacy.html`)
- Export data (JSON download) and clear all data (with confirmation) in options footer
- Character unlock toast notification shown in content script on first unlock
- `getCopy(locale)` system with `en` and `hi` bundles; fallback to English for unknown locales

### Changed
- Options page: Audio, Theme (sepia/forest), Character grid, Language, Focus mode, Accessibility, and Sites sections
- Session-controller: user's reduced-motion setting overrides OS `prefers-reduced-motion`

---

## [0.3.0] — Phase 3

### Added
- Audio subsystem: silent, chime, ambient music (lo-fi rain / forest / Tibetan bowl), calm voice, hype voice
- Tab ducking: reduces Spotify/YouTube volume to 60% during sessions, restores on completion
- `DUCK_TABS` / `RESTORE_TABS` message routing through service worker (MV3 constraint)
- Reduced-motion support: respects `prefers-reduced-motion`, configurable override in options
- Four visual themes: Light, Dark, Sepia, Forest via CSS custom properties
- Skip-today prompt after 3 consecutive dismissals
- Streak tracking: today's session count, total sessions, last session date

---

## [0.2.0] — Phase 2

### Added
- Shadow DOM isolation for overlay (`breath-break-overlay` custom element)
- `BreathingEngine` + `Pacer` RAF-driven state machine
- Box breathing (4-4-4-4) and coherent breathing (5-5) patterns
- Progress bar and phase labels with ARIA live regions
- Focus trap and keyboard dismiss (Alt+Shift+B)
- Mood check-in (4 emoji) after session completion
- Snooze 30 minutes on auto-snooze after dismissal
- Sleep-mode suppression after 22:00

---

## [0.1.0] — Phase 1

### Added
- Chrome MV3 extension scaffold (Vite + CRXJS)
- `chrome.alarms`-based scheduler with ramp presets (slow / adaptive / ready)
- Target-site hostname filtering
- `chrome.storage.sync` settings with `DEFAULT_SETTINGS`
- `enabled` toggle in popup
- `GET_STATUS` message for popup status display
