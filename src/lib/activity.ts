const IDLE_TIMEOUT_MS = 30_000;

let lastInteractionAt = 0;
let isTabFocused = typeof document !== 'undefined' && document.hasFocus();
let accumulatedSeconds = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let onTickCallback: ((seconds: number) => void) | null = null;

function onInteraction() {
  lastInteractionAt = Date.now();
}

const onFocus = () => { isTabFocused = true; };
const onBlur = () => { isTabFocused = false; };
const onVisibility = () => { isTabFocused = document.visibilityState === 'visible'; };

function isActive(): boolean {
  return isTabFocused && Date.now() - lastInteractionAt < IDLE_TIMEOUT_MS;
}

export function startActivityTracking(onTick?: (seconds: number) => void): void {
  onTickCallback = onTick ?? null;
  const events: (keyof DocumentEventMap)[] = ['scroll', 'keypress', 'mousemove', 'click'];
  events.forEach(e => document.addEventListener(e, onInteraction, { passive: true }));
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);
  intervalId = setInterval(() => {
    if (isActive()) {
      accumulatedSeconds += 1;
      onTickCallback?.(accumulatedSeconds);
    }
  }, 1000);
}

export function stopActivityTracking(): void {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  const events: (keyof DocumentEventMap)[] = ['scroll', 'keypress', 'mousemove', 'click'];
  events.forEach(e => document.removeEventListener(e, onInteraction));
  window.removeEventListener('focus', onFocus);
  window.removeEventListener('blur', onBlur);
  document.removeEventListener('visibilitychange', onVisibility);
}

export function getAccumulatedSeconds(): number {
  return accumulatedSeconds;
}

export function resetAccumulatedSeconds(): void {
  accumulatedSeconds = 0;
}
