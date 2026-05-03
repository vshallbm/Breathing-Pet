---
title: "feat: Overlay fallback for non-injectable Chrome pages"
type: feat
status: active
date: 2026-05-03
---

# feat: Overlay fallback for non-injectable Chrome pages

## Summary

The breathing overlay is delivered via a content script injected into the active tab. Chrome's security model prevents injection on `chrome://` pages (New Tab, Settings, Extensions, History), the built-in PDF viewer, and `file://` URLs. This plan adds an `isInjectableUrl` guard, a `chrome.notifications` fallback that fires when `everywhereMode` users are on a non-injectable page, and a standalone `src/breathing/breathing.html` page the notification opens. It also fixes the buddy mode Pomodoro clock, which currently routes its `SHOW_OVERLAY` trigger through the background SW's active-tab lookup (breaking it when the buddy tab is not the focused window).

---

## Problem Frame

When `everywhereMode = true` and the alarm fires while the user is on `chrome://newtab`, `chrome://settings`, or the built-in PDF viewer, `notifyActiveTabOnTargetSite` silently swallows the `sendMessage` failure. The break is permanently discarded — no retry, no user signal. Users who keep a new-tab page open between tasks can go extended periods without breathing prompts while believing the extension is working.

For site-targeted users (`everywhereMode = false`) a `chrome://` page is correctly outside scope — no change needed for them.

---

## Requirements

- R1. Detect when the active tab URL is non-injectable before attempting `chrome.tabs.sendMessage`
- R2. When `everywhereMode = true` and the tab is non-injectable, deliver the break via `chrome.notifications` with a "Breathe now" action button
- R3. The "Breathe now" action opens a dedicated web-accessible breathing page in a new tab
- R4. The dedicated breathing page must render a full session using the existing `BreathingEngine` + `Pacer` stack and report `SESSION_COMPLETE` / `SESSION_DISMISSED` to the background on completion
- R5. Site-targeted mode users (`everywhereMode = false`) receive no change in behaviour — breaks on `chrome://` pages remain silently skipped
- R6. The buddy mode Pomodoro `SHOW_OVERLAY` trigger must dispatch directly to the local overlay element rather than routing through the background SW's active-tab lookup

---

## Scope Boundaries

- No content script injection into `chrome://` pages (Chrome security boundary — not overridable)
- No NTP override via `chrome_url_overrides` — too heavy-handed
- No new `permissions` array entries — `notifications`, `tabs`, `scripting`, and `storage` are already declared in the manifest. The only manifest change is adding `src/breathing/breathing.html` to `web_accessible_resources.resources`, which is not a permission.
- No `file://` support — requires a user-granted "Allow access to file URLs" setting outside the extension's control
- No injection into other extensions' pages
- `all_frames` injection is out of scope — overlay targets top-level browsing context only
- Buddy mode on non-injectable pages: R6 fixes the dispatch routing for the Pomodoro clock on injectable pages. If a user somehow has buddy mode on a `chrome://` page (which cannot happen — buddy mode requires the content script which only injects on `http/https`), it is out of scope. No notification fallback for buddy mode.

### Deferred to Follow-Up Work

- Reschedule / retry logic when the user dismisses the notification without taking a break: separate PR

---

## Context & Research

### Relevant Code and Patterns

- `src/background/scheduler.ts` — `notifyActiveTabOnTargetSite` is the dispatch point; the non-injectable catch is at line 65
- `src/lib/guards.ts` — `shouldSuppressOverlay`, `isDenyListed`, etc.; the right home for `isInjectableUrl`
- `src/content/overlay.ts` — `BreathBreakOverlay` custom element; the dedicated breathing page will reuse it directly
- `src/onboarding/onboarding.ts` — precedent for a standalone extension page that hosts `BreathingEngine` + `Pacer` without the full overlay custom element
- `src/content/buddy.ts:64` — current incorrect dispatch: `chrome.runtime.sendMessage({ type: 'SHOW_OVERLAY' })` routes to SW which looks for the active tab
- `vite.config.ts` — `rollupOptions.input` already adds `onboarding` and `privacy` as entry points; the breathing page follows the same pattern
- `src/background/service-worker.ts` — `chrome.notifications.onButtonClicked` listener needs wiring; the manifest already declares `notifications` permission

### Institutional Learnings

- None in `docs/solutions/` yet.

### External References

- Chrome content script match patterns: `<all_urls>` expands to `http://*/*` + `https://*/*` + `ftp://*/*` only — never `chrome://` or `chrome-extension://` schemes
- `chrome.notifications` button clicks fire `onButtonClicked(notifId, buttonIndex)` in the service worker; `buttonIndex 0` = first button

---

## Key Technical Decisions

- **Detection via URL scheme**: `isInjectableUrl` checks `url.startsWith('http:') || url.startsWith('https:')`. FTP is technically injectable but unused in practice — the guard can be extended later. Simple string prefix is cheaper than `new URL()` parsing in the hot scheduler path.
- **Notification fallback only for everywhereMode**: Site-targeted users deliberately scoped breaks to specific sites. Adding a notification fallback for them would contradict their explicit setting. The guard is `everywhereMode && !isInjectableUrl(activeTab.url)`.
- **Dedicated breathing page over auto-navigation**: Opening `breathing.html` in a new tab preserves the user's current page context. Auto-navigating away from `chrome://newtab` would be jarring. The user opts in by clicking the notification button.
- **Reuse `BreathBreakOverlay` custom element**: The dedicated page uses the same Shadow DOM overlay as content script injection. This avoids duplicating the session logic.
- **Notification ID constant**: Use a stable `NOTIF_ID = 'breath-break-break'` so a new alarm cancels any existing unactioned notification rather than stacking them.

---

## Open Questions

### Resolved During Planning

- *Can `chrome.notifications` buttons open a new tab from the SW?*  Resolution: Yes — `chrome.tabs.create({ url: chrome.runtime.getURL('src/breathing/breathing.html') })` is valid in a SW context.
- *Does `<all_urls>` in `web_accessible_resources` already allow opening breathing.html from a notification click?* Resolution: Yes — `chrome.runtime.getURL(...)` produces a `chrome-extension://` URL; web_accessible_resources only governs access from web pages, not from the extension itself. The tab can always be opened.

### Deferred to Implementation

- Whether to auto-close the breathing tab after `SESSION_COMPLETE` or let the user close it manually — implementer decides based on UX feel

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

```
Alarm fires
    │
    ▼
notifyActiveTabOnTargetSite(targetSites, everywhereMode)
    │
    ├── everywhereMode = false → site-match check → sendMessage (unchanged)
    │
    └── everywhereMode = true
            │
            ├── isInjectableUrl(tab.url) = true  → sendMessage (unchanged)
            │
            └── isInjectableUrl(tab.url) = false
                    │
                    ▼
              chrome.notifications.create(NOTIF_ID, {
                type: 'basic',
                title: 'Time for a breath break',
                buttons: [{ title: 'Breathe now' }],
              })

chrome.notifications.onButtonClicked(NOTIF_ID, 0)
    │
    ▼
chrome.tabs.create({ url: chrome.runtime.getURL('src/breathing/breathing.html') })

breathing.html
    └── <breath-break-overlay> auto-show()
            └── SessionController.start()
                    ├── onComplete → chrome.runtime.sendMessage('SESSION_COMPLETE')
                    └── onAborted → chrome.runtime.sendMessage('SESSION_DISMISSED')
```

---

## Implementation Units

- U1. **Add `isInjectableUrl` URL scheme guard**

**Goal:** Provide a shared, testable helper that returns `true` only for URL schemes where content scripts can inject.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `src/lib/guards.ts`
- Test: `tests/guards.test.ts` (extend existing file)

**Approach:**
- Export `function isInjectableUrl(url: string): boolean` — returns `true` when `url` starts with `http:` or `https:`. Returns `false` for `chrome://`, `chrome-extension://`, `file://`, `about:`, `data:`, and empty strings.
- Intentionally avoids `new URL()` parsing: only a scheme prefix check is needed and it avoids throwing on malformed URLs.

**Patterns to follow:**
- `src/lib/guards.ts` — existing simple, composable guard functions

**Test scenarios:**
- Happy path: `isInjectableUrl('https://example.com')` → `true`
- Happy path: `isInjectableUrl('http://localhost:3000')` → `true`
- Edge case: `isInjectableUrl('chrome://newtab/')` → `false`
- Edge case: `isInjectableUrl('chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/')` → `false`
- Edge case: `isInjectableUrl('file:///Users/alice/doc.pdf')` → `false`
- Edge case: `isInjectableUrl('')` → `false`
- Edge case: `isInjectableUrl('about:blank')` → `false`

**Verification:**
- All test scenarios pass; existing guards tests continue to pass

---

- U2. **Update scheduler to use `isInjectableUrl` and trigger notification fallback**

**Goal:** Stop silently discarding breaks when the active tab is non-injectable; route to notification fallback for `everywhereMode` users.

**Requirements:** R1, R2, R5

**Dependencies:** U1

**Files:**
- Modify: `src/background/scheduler.ts`
- Modify: `src/background/service-worker.ts` (wire `notifications.onButtonClicked`)

**Approach:**
- In `notifyActiveTabOnTargetSite` in `src/background/scheduler.ts`, after retrieving `activeTab` and before calling `chrome.tabs.sendMessage`, call `isInjectableUrl(activeTab.url ?? '')`. This guard lives inside `notifyActiveTabOnTargetSite` — not in the SW-level `onMessage` dispatch switch — because the non-injectable check is a scheduling concern, not a message-routing concern.
- If `false` and `everywhereMode = true`: call a new `notifyViaNotification()` helper (defined in U3) and return.
- If `false` and `everywhereMode = false`: return early (existing silent-skip behaviour — no change).
- The `isInjectableUrl` import comes from `src/lib/guards.ts`.
- No change to the existing `try/catch` around `sendMessage` — it remains as a defensive net for edge cases.

**Patterns to follow:**
- `src/background/scheduler.ts` — existing guard-check pattern (`if (!settings.enabled) return`)

**Test scenarios:**
- Happy path: injectable URL + everywhereMode → `sendMessage` called, notification not fired
- Edge case: non-injectable URL + everywhereMode = true → notification fired, sendMessage not called
- Edge case: non-injectable URL + everywhereMode = false → neither notification nor sendMessage called (silent skip)
- Edge case: `activeTab.url` is undefined → early return (same as current behaviour)

**Verification:**
- Unit tests pass; manual test: set everywhereMode, navigate to `chrome://newtab`, wait for alarm → notification appears

---

- U3. **Add `notifyViaNotification` fallback and wire `onButtonClicked`**

**Goal:** Fire a Chrome notification with a "Breathe now" button when the active tab is non-injectable in everywhereMode, and open the breathing page when the user clicks it.

**Requirements:** R2, R3

**Dependencies:** U1, U4

**Files:**
- Create: `src/background/notifications.ts`
- Modify: `src/background/service-worker.ts`

**Approach:**
- `src/background/notifications.ts` exports:
  - `BREAK_NOTIF_ID = 'breath-break-break'`
  - `notifyViaNotification(): void` — calls `chrome.notifications.create(BREAK_NOTIF_ID, { type: 'basic', iconUrl: chrome.runtime.getURL('src/assets/icons/icon-48.png'), title: 'Time for a breath break', message: 'One minute to reset.', buttons: [{ title: 'Breathe now 🐱' }] })`. Using `void` return (no await) keeps the scheduler path non-blocking.
  - `initNotificationListeners(): void` — registers `chrome.notifications.onButtonClicked` listener once
- In `service-worker.ts`:
  - Import `initNotificationListeners` and call it once at module top level (same pattern as `chrome.alarms.onAlarm.addListener`)
  - The `onButtonClicked` handler: when `notifId === BREAK_NOTIF_ID && buttonIndex === 0`, call `chrome.tabs.create({ url: chrome.runtime.getURL('src/breathing/breathing.html') })` and `chrome.notifications.clear(BREAK_NOTIF_ID)`

**Patterns to follow:**
- `src/background/digest.ts` — `NOTIF_ID` constant + `chrome.notifications.create` pattern

**Test scenarios:**
- Happy path: `notifyViaNotification()` fires without throwing when Chrome notifications API is available
- Happy path: `onButtonClicked` with matching `BREAK_NOTIF_ID` and `buttonIndex=0` → tab opened with breathing URL, notification cleared
- Edge case: `onButtonClicked` with different `notifId` → no action taken
- Edge case: `onButtonClicked` with `buttonIndex=1` (non-existent) → no action taken

**Verification:**
- Manual: trigger fallback → notification appears; click "Breathe now" → breathing.html opens in a new tab

---

- U4. **Create dedicated breathing page**

**Goal:** A standalone extension page that auto-launches a full breathing session using the existing overlay infrastructure, then closes or remains open after the session.

**Requirements:** R3, R4

**Dependencies:** None (parallel with U1–U3)

**Files:**
- Create: `src/breathing/breathing.html`
- Create: `src/breathing/breathing.ts`
- Modify: `vite.config.ts` (add `breathing` entry point)
- Modify: `vite.config.ts` manifest section (add `src/breathing/breathing.html` to `web_accessible_resources`)

**Approach:**
- `breathing.html`: minimal HTML page that imports `breathing.ts` as a module script. Includes the `<breath-break-overlay>` element and a loading state.
- `breathing.ts`:
  - Imports `BreathBreakOverlay` from `src/content/overlay.ts` (registers the custom element)
  - On `DOMContentLoaded`, gets or creates the overlay element and calls `.show()`
  - The overlay's `onComplete` / `onAborted` callbacks (routed through `SessionController`) already call `chrome.runtime.sendMessage('SESSION_COMPLETE')` / `SESSION_DISMISSED` — no additional wiring needed
- `vite.config.ts`: add `breathing: 'src/breathing/breathing.html'` to `rollupOptions.input`; add `'src/breathing/breathing.html'` to the `web_accessible_resources.resources` array

**Patterns to follow:**
- `src/onboarding/onboarding.html` + `onboarding.ts` — standalone extension page using the same BreathingEngine + Pacer stack
- `vite.config.ts` existing `rollupOptions.input` entries

**Test scenarios:**
- Integration: opening `breathing.html` in a browser context renders the overlay and auto-starts the session without manual interaction
- Integration: completing the session sends `SESSION_COMPLETE` to the SW (verifiable via SW message logs)
- Integration: closing the tab mid-session sends `SESSION_DISMISSED` or no message (acceptable — tab close is abrupt)

**Verification:**
- `vite build` succeeds with the new entry; `dist/` contains `breathing.html`; opening the page in an installed extension auto-starts the overlay

---

- U5. **Fix buddy mode Pomodoro `SHOW_OVERLAY` dispatch**

**Goal:** Make the buddy mode Pomodoro clock trigger the overlay on the current page directly rather than routing through the background service worker's active-tab lookup (which silently fails when the buddy tab is not the focused window).

**Requirements:** R6

**Dependencies:** None (self-contained to `src/content/buddy.ts`)

**Files:**
- Modify: `src/content/buddy.ts`

**Approach:**
- Replace `chrome.runtime.sendMessage({ type: 'SHOW_OVERLAY' })` with a direct call to the overlay element: `const overlay = document.querySelector('breath-break-overlay') as unknown as { show: () => Promise<void> } | null; overlay?.show().catch(() => undefined);`
- The content script in `src/content/index.ts` always calls `getOrCreateOverlay()` on `SHOW_OVERLAY` messages, which creates the element if absent. Since buddy and overlay are both content script code running in the same page, `document.querySelector('breath-break-overlay')` will find the existing element (created by `getOrCreateOverlay` on first show) or be null (in which case the call is a no-op until the next Pomodoro cycle).
- If `breath-break-overlay` is not yet in the DOM (no previous session), call `getOrCreateOverlay` equivalent inline: `const host = document.getElementById('breath-break-root') ?? (() => { const h = document.createElement('div'); h.id = 'breath-break-root'; document.body.appendChild(h); return h; })(); if (!host.querySelector('breath-break-overlay')) { const el = document.createElement('breath-break-overlay'); host.appendChild(el); } (host.querySelector('breath-break-overlay') as unknown as { show: () => void })?.show();`
- Simpler alternative: import `getOrCreateOverlay` from `src/content/index.ts` and call `(getOrCreateOverlay() as unknown as { show: () => void }).show()` — but this creates a circular dependency since `index.ts` imports `buddy.ts`. Prefer the inline DOM approach.

**Patterns to follow:**
- `src/content/overlay.ts` — `show()` method signature
- `src/content/index.ts` — `getOrCreateOverlay` DOM creation pattern

**Test scenarios:**
- Happy path: Pomodoro work block completes → overlay appears on the current page regardless of whether it is the active window
- Edge case: `breath-break-overlay` element not yet in DOM when Pomodoro fires → element created and `show()` called
- Edge case: overlay is already visible (previous session still open) → `_show()` guard (`if (suppressed || this.backdrop) return`) prevents double-render

**Verification:**
- Manual: enable buddy mode, navigate to a target site, open a second window, make the buddy tab inactive, wait for Pomodoro cycle → overlay appears in the buddy tab

---

## System-Wide Impact

- **Interaction graph:** `chrome.notifications.onButtonClicked` is a new SW listener entry point — it must be registered at SW module top level (not inside an async callback) to survive SW wake-up cycles. The `breathing.html` page communicates back to the SW via `chrome.runtime.sendMessage` using the existing `SESSION_COMPLETE` / `SESSION_DISMISSED` message types — no new message types needed.
- **Error propagation:** `notifyViaNotification()` is fire-and-forget (`void`). If `chrome.notifications.create` fails (e.g., notifications disabled by the user at OS level), the break is silently skipped — same behaviour as the current non-injectable silent skip. This is acceptable.
- **State lifecycle risks:** The stable `BREAK_NOTIF_ID` means a new break alarm replaces an unactioned notification rather than stacking. If the user dismisses the notification without clicking "Breathe now", the break is lost — this is intentional and deferred to a follow-up (reschedule on dismiss).
- **API surface parity:** `SESSION_COMPLETE` and `SESSION_DISMISSED` are already handled by the SW's `onMessage` listener. The listener does not filter by sender (no `sender.tab` or `sender.url` check in `service-worker.ts`), so messages from `breathing.html` — a `chrome-extension://` page, not a content script running inside a tab — are received and processed identically to those from the overlay injected via the content script. No new message routing is needed.
- **Integration coverage:** The breathing page uses `SessionController` which calls `chrome.runtime.sendMessage` — the page must be opened as an extension page (not a web page) for `chrome.runtime` to be available. Since it's in `web_accessible_resources` and opened via `chrome.runtime.getURL(...)`, it runs with extension context. Verify this in integration.
- **Unchanged invariants:** Site-targeted break scheduling (`everywhereMode = false`) is completely unmodified. The existing overlay custom element, `BreathingEngine`, `Pacer`, and `SessionController` are reused without change.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `chrome.notifications` buttons not available in all Chrome versions | Buttons have been available since MV2; MV3 minimum Chrome version (88) fully supports them. Low risk. |
| `breathing.html` opened as a new tab feels disruptive — user loses context | Notification is opt-in (user clicks "Breathe now"). Alternative: use `chrome.windows.create` with a smaller popup window — defer to implementer UX judgment. |
| Buddy mode inline DOM creation duplicates logic from `index.ts` | Accept the small duplication to avoid circular import. If the pattern is needed in a third place, extract to a shared helper. |
| `chrome.notifications.onButtonClicked` may fire after SW termination | SW event listeners registered at module top level are re-registered on each SW wake. Chrome guarantees the SW wakes for `onButtonClicked` just as it does for `onAlarm`. |
| `vite build` entry point for breathing page fails if CRXJS doesn't handle it | Follow the same pattern as `onboarding.html` which already works. If CRXJS requires special config for inner pages, the fallback is to list it only in `web_accessible_resources` and use a simple `<script type="module">` tag. |

---

## Sources & References

- Related code: `src/background/scheduler.ts`, `src/lib/guards.ts`, `src/content/buddy.ts`, `src/background/digest.ts`, `src/onboarding/onboarding.ts`
- Chrome content script URL matching: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
- Chrome notifications API: https://developer.chrome.com/docs/extensions/reference/api/notifications
