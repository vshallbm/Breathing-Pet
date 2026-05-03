# Accessibility

## Keyboard navigation

| Shortcut | Context | Action |
|---|---|---|
| `Alt+Shift+B` | Any page with overlay | Dismiss/abort session |
| `Tab` / `Shift+Tab` | Overlay open | Cycle through focusable elements |
| `Enter` / `Space` | Mood buttons, Done, Skip | Activate button |
| `Escape` | Paywall modal | Close modal |

Focus is trapped inside the overlay card while a session is active. When the post-session view appears, focus re-traps within that card. Focus returns to the page when the overlay closes.

## Screen reader support

- Overlay root element: `role="dialog"`, `aria-modal="true"`, `aria-label="Breath Break"`
- Phase labels: `aria-live="polite"` `aria-atomic="true"` — screen reader announces each new phase ("Inhale", "Hold", "Exhale")
- Progress bar: `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` updated continuously
- Aura animation ring: `aria-hidden="true"` (decorative)
- Mood buttons: `aria-label` set to the emoji character name
- An off-screen `aria-live="assertive"` region (`announceToScreenReader`) is used for milestone announcements

## Reduced motion

Three options in Settings → Accessibility:

- **Match system preference** (default): honours `prefers-reduced-motion: reduce`
- **Always reduce motion**: disables aura pulse, replaces with a static ring that fills
- **Never reduce motion**: always plays animations regardless of OS setting

When motion is reduced the aura `@keyframes` are replaced with a static opacity transition. The progress bar still advances.

## Colour contrast

All four themes (Light, Dark, Sepia, Forest) target WCAG AA contrast ratios for text on background. Interactive elements use `focus-visible` outlines (`2px solid currentColor`, 2px offset).

## Touch / pointer

The mascot "pet" interaction works with both mouse click and touch (`click` event fires on touch). Minimum touch target size is 44×44 px for all buttons.

## VoiceOver walkthrough (macOS, Safari/Chrome)

1. Overlay appears — VO announces "Breath Break, web dialog"
2. Focus moves to the Exit button (first focusable element)
3. Phase label change — VO announces "Inhale" / "Hold" / "Exhale" automatically
4. Session completes — VO announces the post-session phase label
5. Mood row announced as a group: "How do you feel?"
6. "Done" button closes overlay, focus returns to the underlying page

## Known limitations

- The breathing aura animation relies on SVG `r` attribute animation; VoiceOver treats it as decorative (correct)
- Mood emoji labels use the emoji character as the accessible name — a future improvement would be to use descriptive labels like "Very calm", "Calm", "Neutral", "Stressed"
- The body-double corner widget does not currently implement a keyboard dismiss
