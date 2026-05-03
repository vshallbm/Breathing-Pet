---
title: "fix: Scheduler reliability — lastFocusedWindow and TRIGGER_BREAK confirmation"
type: fix
status: active
date: 2026-05-03
---

# fix: Scheduler reliability — lastFocusedWindow and TRIGGER_BREAK confirmation

## Summary

Fixes two reliability gaps discovered during an investigation of the timer and core functionality. The core alarm-based scheduler is structurally sound; these fixes address (1) a window-targeting bug that causes the break alarm to fire on the wrong tab in multi-window setups, and (2) a fire-and-forget gap in the manual "breathe now" CTA where the popup closes without knowing whether the content script actually received and processed the overlay request.

---

## Problem Frame

The investigation confirmed the alarm scheduler, breathing engine timer, and overlay delivery chain are all intact — no broken connections. Two reliability issues were identified:

1. **`currentWindow: true` targets the wrong window under multi-window use** — `chrome.tabs.query({ currentWindow: true })` from a service worker context queries the window that owned the most-recently-activated tab, which can differ from the window the user is actually looking at. The correct filter for extension alarm handlers is `lastFocusedWindow: true`.

2. **`TRIGGER_BREAK` sends `ok: true` before the content script confirms receipt** — the service worker fires `chrome.tabs.sendMessage` as fire-and-forget, then immediately sends `{ ok: true }` to the popup. The popup closes before knowing whether the overlay appeared. If the content script is not yet injected (tab just loaded, fresh install, BFCache restore), the message is silently dropped and the user sees the popup close with no overlay.

---

## Requirements

- R1. When the scheduled alarm fires, the overlay is delivered to the tab in the window the user is currently looking at, not an arbitrary background window
- R2. When the user clicks "breathe now", `ok: true` is returned only if the content script confirmed it received `SHOW_OVERLAY` — otherwise `ok: false` is returned so the popup can show the inline hint

---

## Scope Boundaries

- No changes to alarm scheduling intervals, ramp logic, or daily limits — these were verified correct
- No changes to the breathing engine timer (requestAnimationFrame-based) — verified correct
- No changes to the overlay suppression logic (`shouldSuppressOverlay`) — the popup receiving `ok: true` does NOT guarantee the overlay will actually be visible to the user (it may be suppressed silently by guards); that is accepted behavior documented in the existing plan
- E2E tests remain deferred (pre-existing Playwright timeout issue)

### Deferred to Follow-Up Work

- Surfacing a hint when the overlay was suppressed by `shouldSuppressOverlay()` (e.g., user is typing): separate UX decision

---

## Context & Research

### Relevant Code and Patterns

- `src/background/scheduler.ts:60` — `chrome.tabs.query({ active: true, currentWindow: true })` — one-line fix
- `src/background/service-worker.ts:167-175` — `TRIGGER_BREAK` case, fire-and-forget tabs.sendMessage
- `src/content/index.ts:32-47` — `onMessage` listener: `SHOW_OVERLAY` handler calls `overlay.show().catch()` and returns without calling `sendResponse`
- Pattern for fire-and-forget vs awaited: `CHARACTER_UNLOCK` dispatch in service-worker.ts uses `.catch(() => undefined)` (fire-and-forget, no ack needed); `TRIGGER_BREAK` needs ack so should be awaited with try/catch
- Existing response pattern: `SESSION_DISMISSED` handler in content/index.ts calls `sendResponse({ autoSnooze })` and returns `true`

### Institutional Learnings

- None in docs/solutions/ yet.

---

## Key Technical Decisions

- **`lastFocusedWindow: true` instead of `currentWindow: true`**: Chrome's `lastFocusedWindow: true` queries the most recently focused browser window regardless of which context is running the query. From service worker context, `currentWindow` has unreliable semantics (the SW has no "current window"). `lastFocusedWindow` is the documented correct choice for extension-background tab queries.
- **Content script must call `sendResponse` for `SHOW_OVERLAY` to enable ack**: Chrome's `tabs.sendMessage` only resolves when the receiver's `onMessage` listener returns a value OR calls `sendResponse`. Currently the SHOW_OVERLAY listener returns `undefined` synchronously (no ack). To await delivery, the listener must call `sendResponse({})` (any value) and return `true`. The service worker then wraps `tabs.sendMessage` in try/catch: catch means content script not injected → `sendResponse({ ok: false })`.
- **Scope `sendResponse({})` to SHOW_OVERLAY only**: Do not change other message handlers in content/index.ts. Only SHOW_OVERLAY needs ack.

---

## Open Questions

### Resolved During Planning

- *Does `lastFocusedWindow: true` affect the scheduler's existing behavior on single-window setups?* No — for single window, `lastFocusedWindow` and `currentWindow` both return the same tab. The fix is purely additive for multi-window setups.
- *Does making SHOW_OVERLAY synchronous (calling sendResponse before overlay.show() completes) give false confidence?* The ack only confirms message delivery to the content script listener, not that the overlay finished rendering. The show() call is still async (awaits storage + DOM). `ok: true` means "content script got it and started the show flow", which is sufficient for closing the popup — same guarantee as native browser notifications.

### Deferred to Implementation

- Whether to backfill `sendResponse` for `CHARACTER_UNLOCK` (character toast) — implementer evaluates if ack is needed there too; probably not

---

## Implementation Units

- U1. **Fix `lastFocusedWindow: true` in scheduler**

**Goal:** Ensure the scheduled alarm targets the tab in the window the user is currently looking at, not a background window.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `src/background/scheduler.ts`
- Test: `tests/guards.test.ts` (no new test needed — single-line change with no branching logic to cover)

**Approach:**
- In `notifyActiveTabOnTargetSite`, change `chrome.tabs.query({ active: true, currentWindow: true })` to `chrome.tabs.query({ active: true, lastFocusedWindow: true })`
- No other changes in this function

**Patterns to follow:**
- Chrome extension documentation: `lastFocusedWindow: true` is the correct filter for background→content tab queries

**Test scenarios:**
- Test expectation: none — single-line filter change; no branching. Correctness is verified by the scheduler integration test (existing) and manual multi-window testing.

**Verification:**
- `npm run build` passes; `npm test` passes (156 tests); the one-line diff is visually reviewed

---

- U2. **Wire SHOW_OVERLAY acknowledgement for TRIGGER_BREAK confirmation**

**Goal:** Make the "breathe now" popup CTA return `ok: true` only when the content script actually received the overlay message, so the popup closes with real confirmation rather than assumed success.

**Requirements:** R2

**Dependencies:** None (U1 and U2 are independent)

**Files:**
- Modify: `src/content/index.ts`
- Modify: `src/background/service-worker.ts`
- Test: `tests/sw-trigger-break.test.ts` (new)

**Approach:**
- In `content/index.ts` SHOW_OVERLAY handler: call `sendResponse({})` and return `true` so the sender's promise resolves. The `overlay.show()` call remains fire-and-forget (its result is not communicated back).
- In `service-worker.ts` TRIGGER_BREAK case: replace `.catch(() => undefined)` fire-and-forget with `await chrome.tabs.sendMessage(...)` wrapped in try/catch. On success: `sendResponse({ ok: true })`. On catch (content script not injected): `sendResponse({ ok: false })`.

**Patterns to follow:**
- `content/index.ts` SESSION_DISMISSED handler: calls `sendResponse(...)` and returns `true`
- `service-worker.ts` SESSION_COMPLETE case: `await`-based response pattern

**Test scenarios:**
- Happy path: query returns `[{ id: 1, url: 'https://example.com' }]`, `tabs.sendMessage` resolves → `sendResponse({ ok: true })`
- Edge case: query returns `[{ id: 1, url: 'https://example.com' }]`, `tabs.sendMessage` throws (content script not injected) → `sendResponse({ ok: false })`
- Edge case: query returns `[]` (no active tab) → `sendResponse({ ok: false })`
- Edge case: query returns `[{ id: 1, url: 'chrome://newtab/' }]` → `isInjectableUrl` returns false → `sendResponse({ ok: false })`, `tabs.sendMessage` not called

**Verification:**
- `npm test` passes with new tests added
- Manual test: click "breathe now" on `chrome://newtab` → popup stays open with hint; click on an `https://` tab with the extension loaded → popup closes and overlay appears

---

- U3. **Add unit tests for popup breathe-now click handler**

**Goal:** Cover the popup's ok/not-ok response branches and the 2500ms status-text reset.

**Requirements:** R2 (coverage of the change in U2's popup side)

**Dependencies:** U2 (tests should match the new behavior where ok:true means confirmed delivery)

**Files:**
- Test: `tests/popup-breathe-now.test.ts` (new)

**Approach:**
- Use Vitest with `vi.stubGlobal` for `chrome.runtime.sendMessage`
- Use `vi.useFakeTimers()` for the 2500ms timeout test
- Spy on `window.close` for the ok:true path
- Set up a minimal DOM with `#breathe-now-btn` and `#status-text`

**Patterns to follow:**
- `tests/storage.test.ts` for `vi.stubGlobal('chrome', ...)` pattern
- `tests/guards-extended.test.ts` for jsdom-based DOM tests

**Test scenarios:**
- Happy path: `sendMessage` resolves `{ ok: true }` → `window.close()` called
- Error path: `sendMessage` resolves `{ ok: false }` → `#status-text` shows hint, `window.close()` not called
- Edge case: `sendMessage` resolves `undefined` (SW inactive) → treated as not-ok, hint shown
- Edge case: `sendMessage` rejects (SW terminated mid-flight) → handled by try/catch, hint shown
- Timer: after ok:false, advance fake timers 2500ms → `#status-text` restored to original value

**Verification:**
- `npm test` passes with all new test cases green

---

## System-Wide Impact

- **Interaction graph:** `lastFocusedWindow` change affects only `notifyActiveTabOnTargetSite` in scheduler.ts; no other alarm paths change. SHOW_OVERLAY ack change affects only the content/index.ts SHOW_OVERLAY case and the service-worker.ts TRIGGER_BREAK case; auto-alarm SHOW_OVERLAY delivery from `notifyActiveTabOnTargetSite` is unaffected (it does not check the ack).
- **Error propagation:** TRIGGER_BREAK now propagates content-script-not-injected as `ok: false` to the popup, giving the user the inline hint instead of false success.
- **Unchanged invariants:** The scheduled alarm delivery path (`notifyActiveTabOnTargetSite`) remains fire-and-forget for SHOW_OVERLAY — it does not need ack because the user doesn't get popup feedback from alarm-triggered breaks. Only TRIGGER_BREAK needs the ack. These two paths stay independent.
- **API surface parity:** CHARACTER_UNLOCK and other fire-and-forget dispatches in service-worker.ts are not affected.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `sendResponse({})` in SHOW_OVERLAY handler runs before `overlay.show()` completes | Accepted: ack means "message received and show started", not "overlay fully rendered". This is sufficient for the popup close decision. |
| `lastFocusedWindow: true` returns a pinned tab or background tab the user didn't expect | Very unlikely: `active: true` + `lastFocusedWindow: true` returns the active (foreground) tab of the last focused window — exactly the tab the user is looking at. |
| Content script may be injected but context-invalidated (extension updated) | `tabs.sendMessage` throws in this case → caught → `ok: false` → popup shows hint. Correct behavior. |

---

## Sources & References

- Related plan: `docs/plans/2026-05-03-002-feat-breathe-now-cta-plan.md`
- Related code: `src/background/scheduler.ts`, `src/content/index.ts`, `src/background/service-worker.ts`
