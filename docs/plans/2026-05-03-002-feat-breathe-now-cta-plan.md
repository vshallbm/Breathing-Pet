---
title: "feat: Add \"Breathe now\" CTA to popup"
type: feat
status: active
date: 2026-05-03
---

# feat: Add "Breathe now" CTA to popup

## Summary

Adds a full-width "breathe now" button to the popup that immediately triggers a breathing session on the currently active tab, bypassing the scheduled alarm timer. The button routes `TRIGGER_BREAK` through the background service worker, which delivers `SHOW_OVERLAY` to the tab (or sends back a non-injectable signal for `chrome://` pages). This gives users an on-demand escape hatch without waiting for the next alarm.

---

## Problem Frame

Breaks currently only fire when the alarm scheduler decides it is time. Users who want to take a mindful pause right now have no way to trigger one from the extension — they must wait or open settings and adjust the interval. A single CTA in the popup removes this friction.

---

## Requirements

- R1. A "breathe now" button is present in the popup, styled to match the extension's vibey aesthetic, and visible without scrolling
- R2. Clicking the button triggers the breathing overlay on the currently active tab when that tab is injectable (`http`/`https`)
- R3. The overlay is triggered regardless of the extension's snooze or enabled state — this is a manual, user-initiated break that overrides the scheduler
- R4. When the active tab is non-injectable (e.g., `chrome://newtab`, `chrome://settings`), the popup shows a brief inline hint directing the user to a regular webpage
- R5. The button closes the popup after a successful trigger so the overlay is unobstructed

---

## Scope Boundaries

- No changes to the automatic alarm-based scheduling path
- No new overlay suppression bypasses — `shouldSuppressOverlay()` in `src/lib/guards.ts` runs as normal (guards typing, fullscreen, PiP, media-call, deny-list)
- No visual changes to the overlay itself
- E2E tests are deferred — existing Playwright smoke tests have an undiagnosed service-worker timeout issue; adding more E2E coverage before that root cause is resolved would produce flaky tests

### Deferred to Follow-Up Work

- E2E test for the CTA: deferred until Playwright service-worker detection is fixed (`tests/e2e/extension.spec.ts` timeout root cause unknown)
- "Breathe now" from the notification fallback path (non-injectable tab): handled by the parallel plan `docs/plans/2026-05-03-001-feat-overlay-non-injectable-page-fallback-plan.md` (U3/U4)

---

## Context & Research

### Relevant Code and Patterns

- `src/popup/popup.html` — current popup structure: `.header`, `.vibes`, `.capsule` (enable toggle), `.chips` (snooze buttons), `.footer`. The CTA sits between `.capsule` and `.chips`.
- `src/popup/popup.ts` — `init()` is the entry point; all popup→background calls use `chrome.runtime.sendMessage({ type: '...' })`; follow the `data-snooze` chip handler pattern
- `src/popup/popup.css` — existing design tokens (`--accent`, `--paper`, `--hair`, `--surface`); `.chip` class is the base for interactive row buttons
- `src/types.ts` — `MessageType` discriminated union; add a new variant here
- `src/background/service-worker.ts` — `onMessage` switch; `case 'SNOOZE'` is the closest model for a one-shot popup→background action
- `src/background/scheduler.ts` — `notifyActiveTabOnTargetSite` uses `isInjectableUrl` and `chrome.tabs.sendMessage(tab.id, { type: 'SHOW_OVERLAY' })` — the same pattern the new handler uses
- `src/lib/guards.ts` — `isInjectableUrl(url: string): boolean` is already present and tested

### Institutional Learnings

- No `docs/solutions/` entries yet.

### External References

- None required — all patterns are local.

---

## Key Technical Decisions

- **Bypass scheduler, not overlay**: `TRIGGER_BREAK` skips the enabled/snooze checks in the scheduler. The overlay's own `shouldSuppressOverlay()` guards (fullscreen, PiP, typing, media-call, deny-list) still run. This preserves safety guards while giving users a true on-demand escape hatch.
- **Route through background, not direct `tabs.sendMessage` from popup**: The background is the gatekeeper for tab messaging. Routing through the SW keeps the pattern consistent with every other tab-affecting action in the codebase and ensures `isInjectableUrl` is checked in one canonical place.
- **Close popup on success**: Calling `window.close()` after a successful trigger ensures the overlay is not obscured by the popup window. On failure (non-injectable tab), the popup stays open to show the inline hint.
- **Inline hint, not toast**: For the non-injectable case, update the existing `#status-text` element briefly (2–3 s timeout) rather than adding a new toast mechanism. Reuses existing DOM.

---

## Open Questions

### Resolved During Planning

- *Should the CTA respect the extension's enabled/snooze state?* Resolution: No — it is an explicit user action that overrides the scheduler. Users who snoozed still own the decision to breathe now.
- *Where in the popup hierarchy does the button live?* Resolution: Between `.capsule` and `.chips`, as a full-width row. It is the primary positive action; the snooze chips below it are deferral options.
- *Does the button need a sub-label (like the snooze chips)?* Resolution: The sub-label pattern on chips is for contextual clarification of snooze durations. "Breathe now" is self-explanatory — a single label suffices.

### Deferred to Implementation

- Whether the button should be disabled while the popup is loading status (before `init()` completes) — implementer decides based on UX feel

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
User clicks "breathe now" in popup
    │
    ▼
chrome.runtime.sendMessage({ type: 'TRIGGER_BREAK' })
    │
    ▼
service-worker.ts: case 'TRIGGER_BREAK'
    │
    ├── chrome.tabs.query({ active: true, currentWindow: true })
    │           │
    │    isInjectableUrl(tab.url) = true
    │           │
    │           ▼
    │    chrome.tabs.sendMessage(tab.id, { type: 'SHOW_OVERLAY' })
    │           │
    │           ▼
    │    sendResponse({ ok: true })
    │           │
    │           ▼
    │    popup: window.close()  ← overlay now unobstructed
    │
    └── isInjectableUrl(tab.url) = false  (or no active tab)
                │
                ▼
           sendResponse({ ok: false, reason: 'non-injectable' })
                │
                ▼
           popup: update #status-text → "try on a regular webpage 🐱"
                  (reset to original after 2.5 s)
```

---

## Implementation Units

- U1. **Add `TRIGGER_BREAK` message type and service-worker handler**

**Goal:** Wire a new message type that the popup can send to request an immediate break on the active tab.

**Requirements:** R2, R3, R4

**Dependencies:** None (`isInjectableUrl` already exists in `src/lib/guards.ts`)

**Files:**
- Modify: `src/types.ts`
- Modify: `src/background/service-worker.ts`
- Test: `tests/guards.test.ts` — no new unit test needed for `isInjectableUrl` (already covered); consider a lightweight integration-style unit test for the SW handler logic if the switch block becomes extractable

**Approach:**
- Add `{ type: 'TRIGGER_BREAK' }` to the `MessageType` union in `src/types.ts`
- In `service-worker.ts` `onMessage` switch, add `case 'TRIGGER_BREAK'`:
  - Query `chrome.tabs.query({ active: true, currentWindow: true })` for the `[0]` result
  - If no tab or `isInjectableUrl(tab.url ?? '')` is `false`: `sendResponse({ ok: false })`
  - If injectable: call `chrome.tabs.sendMessage(tab.id, { type: 'SHOW_OVERLAY' })`, then `sendResponse({ ok: true })`
  - Wrap in the same async-IIFE + `return true` pattern used by all other cases

**Patterns to follow:**
- `service-worker.ts` case `'SNOOZE'` for the async-IIFE + `return true` pattern
- `src/background/scheduler.ts` `notifyActiveTabOnTargetSite` for the `isInjectableUrl` + `sendMessage` sequence

**Test scenarios:**
- Happy path: active tab has `https://` URL → `chrome.tabs.sendMessage` called with `SHOW_OVERLAY`, response is `{ ok: true }`
- Edge case: active tab has `chrome://newtab` URL → `sendMessage` not called, response is `{ ok: false }`
- Edge case: no active tab found (`tabs.query` returns `[]`) → `sendMessage` not called, response is `{ ok: false }`

**Verification:**
- TypeScript compiles without errors; existing unit tests continue to pass

---

- U2. **Add "Breathe now" CTA button to popup UI**

**Goal:** Surface the CTA in the popup with appropriate styling, click handling, and non-injectable feedback.

**Requirements:** R1, R4, R5

**Dependencies:** U1

**Files:**
- Modify: `src/popup/popup.html`
- Modify: `src/popup/popup.ts`
- Modify: `src/popup/popup.css`

**Approach:**
- `popup.html`: Add a `<button id="breathe-now-btn" type="button" class="breathe-now-btn">breathe now 🐱</button>` between `.capsule` and `.chips`
- `popup.ts`: In `init()`, wire a click handler on `#breathe-now-btn`:
  - Send `{ type: 'TRIGGER_BREAK' }` via `chrome.runtime.sendMessage`
  - On `response.ok === true`: call `window.close()`
  - On `response.ok === false`: update `#status-text` to a short hint (e.g., `"open a webpage first 🐱"`), reset to original after 2500 ms
- `popup.css`: Style `.breathe-now-btn` as a full-width pill button. Follow the `.chip` + `.capsule` token vocabulary (`--accent`, `--paper`, border-radius, subtle shadow). The button should read as the primary action — bolder than chips but still calm.

**Patterns to follow:**
- `popup.ts` snooze chip handler (`data-snooze` buttons): send message → await response → update status text
- `popup.css` `.chip` class: design token usage, hover/active states
- `popup.html` structure: button placement between `.capsule` and `.chips`

**Test scenarios:**
- Happy path: `#breathe-now-btn` exists and is visible in the popup DOM without scrolling
- Happy path: clicking the button on an injectable tab calls `chrome.runtime.sendMessage` with `{ type: 'TRIGGER_BREAK' }` and closes the popup
- Edge case: clicking the button when background responds `{ ok: false }` shows inline hint text in `#status-text` and does NOT close the popup
- Edge case: hint text resets after 2500 ms (timer fires correctly)

**Verification:**
- Visual: button renders between toggle and snooze chips, full-width, styled consistently with existing elements
- Functional: clicking on an injectable tab closes the popup and the overlay appears on the active tab

---

## System-Wide Impact

- **Interaction graph:** The new `TRIGGER_BREAK` message is handled only in the SW `onMessage` switch. No other listeners are added. The existing `SHOW_OVERLAY` path in `content/index.ts` → `overlay.show()` → `shouldSuppressOverlay()` → `SessionController.start()` is unchanged.
- **Error propagation:** `chrome.tabs.sendMessage` to the content script may throw if the content script is not yet injected (page just loaded). Wrap in `.catch(() => undefined)` following the existing `CHARACTER_UNLOCK` dispatch pattern in `service-worker.ts`.
- **State lifecycle risks:** None — the CTA does not mutate storage or alarm state. The overlay's own completion/dismissal handlers (`SESSION_COMPLETE`, `SESSION_DISMISSED`) already update the streak and reschedule normally.
- **Unchanged invariants:** The automatic alarm scheduler path (`handleAlarmFired` → `notifyActiveTabOnTargetSite`) is completely unmodified. Snooze, enabled toggle, and ramp logic all behave as before.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Content script not yet injected when `TRIGGER_BREAK` fires (page freshly loaded) | Wrap `chrome.tabs.sendMessage` in `.catch(() => undefined)` per existing pattern; treat as a no-op. User can click again after the page settles. |
| `shouldSuppressOverlay()` silently suppresses the triggered overlay (e.g., user is typing) | Accepted — the existing guards are safety mechanisms. Document the behaviour in the button's tooltip or sub-label if user confusion arises in testing. |
| `window.close()` called before `sendMessage` round-trip completes | `window.close()` is called inside `then` / `await` after the response — not before. The popup stays open until SW responds. |
| Popup closes before user sees any error | The popup stays open on `{ ok: false }` specifically to show the hint. Only `{ ok: true }` triggers close. |

---

## Sources & References

- Related plan: `docs/plans/2026-05-03-001-feat-overlay-non-injectable-page-fallback-plan.md`
- Related code: `src/background/scheduler.ts`, `src/lib/guards.ts`, `src/popup/popup.ts`, `src/background/service-worker.ts`
