import './overlay';
import { showBuddy, hideBuddy } from './buddy';
import { startActivityTracking, getAccumulatedSeconds } from '../lib/activity';
import { addActiveScrollSeconds } from '../lib/storage';

let overlayEl: HTMLElement | null = null;

// Persist accumulated activity to storage every 30 s so the adaptive scheduler can read it
let lastFlushedSeconds = 0;
startActivityTracking();
setInterval(() => {
  const current = getAccumulatedSeconds();
  const delta = current - lastFlushedSeconds;
  if (delta > 0) {
    lastFlushedSeconds = current;
    addActiveScrollSeconds(delta).catch(() => undefined);
  }
}, 30_000);

function getOrCreateOverlay(): HTMLElement {
  if (!overlayEl) {
    const host = document.createElement('div');
    host.id = 'breath-break-root';
    document.body.appendChild(host);
    const el = document.createElement('breath-break-overlay');
    host.appendChild(el);
    overlayEl = el;
  }
  return overlayEl;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SHOW_OVERLAY') {
    const overlay = getOrCreateOverlay() as unknown as { show: () => Promise<void> };
    overlay.show().catch(() => undefined);
  }
  if (msg.type === 'HIDE_OVERLAY') {
    const overlay = overlayEl as unknown as { hide: () => void } | null;
    overlay?.hide();
  }
  if (msg.type === 'CHARACTER_UNLOCK') {
    const overlay = getOrCreateOverlay() as unknown as { showToast: (msg: string) => void };
    overlay.showToast(`🎉 ${msg.characterLabel} unlocked!`);
  }
  if (msg.type === 'BUDDY_START') showBuddy();
  if (msg.type === 'BUDDY_STOP')  hideBuddy();
});
