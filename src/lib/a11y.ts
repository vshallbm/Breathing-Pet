const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function trapFocus(container: HTMLElement): () => void {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!focusable.length) return () => undefined;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function handler(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  container.addEventListener('keydown', handler);
  first.focus();
  return () => container.removeEventListener('keydown', handler);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function announceToScreenReader(container: ShadowRoot, message: string): void {
  let region = container.getElementById('bb-live-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'bb-live-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    Object.assign(region.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' });
    container.appendChild(region);
  }
  region.textContent = '';
  requestAnimationFrame(() => { region!.textContent = message; });
}
