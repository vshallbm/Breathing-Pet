import { getCopy } from '../copy/index';
import type { CopyKeys } from '../copy/en';

const WAITLIST_URL = 'mailto:hello@breathbreak.app?subject=Waitlist';

export function showPaywallStub(featureName: string, copy?: CopyKeys): void {
  const c = copy ?? getCopy('en-US');
  const existing = document.getElementById('bb-paywall-modal');
  if (existing) { existing.remove(); }

  const modal = document.createElement('div');
  modal.id = 'bb-paywall-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', c.options.paywallTitle);
  modal.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'display:flex', 'align-items:center', 'justify-content:center',
    'background:rgba(0,0,0,0.5)', 'font-family:system-ui,sans-serif',
  ].join(';');

  const card = document.createElement('div');
  card.style.cssText = [
    'background:#fff', 'border-radius:16px', 'padding:28px 32px',
    'max-width:320px', 'width:90%', 'text-align:center', 'box-shadow:0 8px 32px rgba(0,0,0,0.18)',
  ].join(';');

  const title = document.createElement('h2');
  title.textContent = `${featureName} — ${c.options.paywallTitle}`;
  title.style.cssText = 'margin:0 0 12px;font-size:18px;';

  const body = document.createElement('p');
  body.textContent = c.options.paywallBody;
  body.style.cssText = 'margin:0 0 20px;color:#555;font-size:14px;line-height:1.5;';

  const ctaBtn = document.createElement('a');
  ctaBtn.href = WAITLIST_URL;
  ctaBtn.textContent = c.options.paywallCta;
  ctaBtn.style.cssText = [
    'display:inline-block', 'padding:10px 24px', 'background:#7c3aed',
    'color:#fff', 'border-radius:8px', 'text-decoration:none', 'font-size:14px',
    'margin-bottom:12px',
  ].join(';');

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.style.cssText = [
    'position:absolute', 'top:12px', 'right:14px', 'background:none',
    'border:none', 'font-size:18px', 'cursor:pointer', 'color:#888',
  ].join(';');
  card.style.position = 'relative';

  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', onKey); }
  });

  card.append(closeBtn, title, body, ctaBtn);
  modal.appendChild(card);
  document.body.appendChild(modal);
  closeBtn.focus();
}
