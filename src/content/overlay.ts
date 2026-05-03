import overlayCSS from './overlay.css?inline';
import { getCopy } from '../copy/index';
import { getMascotSvg } from './mascots';
import { shouldSuppressOverlay } from '../lib/guards';
import { trapFocus, announceToScreenReader } from '../lib/a11y';
import { SessionController } from './session-controller';
import type { MoodEmoji } from '../types';

const MOOD_EMOJIS: MoodEmoji[] = ['😌', '🙂', '😐', '😣'];

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export class BreathBreakOverlay extends HTMLElement {
  private shadow: ShadowRoot;
  private backdrop: HTMLDivElement | null = null;
  private releaseFocusTrap: (() => void) | null = null;
  private controller: SessionController | null = null;
  private consecutiveSkips = 0;
  private copy = getCopy('en-US');
  private mascotSvg = getMascotSvg('cat');
  private mascotName: string | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = overlayCSS;
    this.shadow.appendChild(style);
  }

  async show(): Promise<void> {
    try {
      await this._show();
    } catch (err) {
      // Error boundary: ensure a failed show() never leaves a stuck backdrop
      console.error('[BreathBreak] overlay error:', err);
      this.hide();
    }
  }

  private async _show(): Promise<void> {
    const { suppressed } = shouldSuppressOverlay();
    if (suppressed || this.backdrop) return;

    const stored = await chrome.storage.sync.get({ locale: 'en-US', character: 'cat', customMascotName: null }) as { locale: string; character: string; customMascotName: string | null };
    this.copy = getCopy(stored.locale);
    this.mascotSvg = getMascotSvg(stored.character);
    this.mascotName = stored.customMascotName;

    const isSleep = new Date().getHours() >= 22;
    const backdrop = document.createElement('div');
    backdrop.className = 'bb-backdrop' + (isSleep ? ' bb-sleep' : '');
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Breath Break');

    backdrop.innerHTML = this.buildSessionHTML();
    this.shadow.appendChild(backdrop);
    this.backdrop = backdrop;

    requestAnimationFrame(() => backdrop.classList.add('visible'));
    this.releaseFocusTrap = trapFocus(backdrop);
    document.addEventListener('keydown', this.handleKeyDown);

    this.startSession();
  }

  private buildSessionHTML(): string {
    return `
      <div class="bb-card">
        <button class="bb-exit" aria-label="${this.copy.overlay.exit}">×</button>

        <div class="bb-pacer-wrap" aria-hidden="true">
          <svg class="bb-aura-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle class="bb-aura" cx="60" cy="60" r="54"/>
          </svg>
          <div class="bb-mascot">${this.mascotSvg}</div>
          ${this.mascotName ? `<div class="bb-mascot-name">${escapeHtml(this.mascotName)}</div>` : ''}
          <div class="bb-counter" aria-hidden="true"></div>
        </div>

        <div class="bb-phase-label" aria-live="polite" aria-atomic="true">
          ${this.copy.preSession.calm}
        </div>

        <div class="bb-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="bb-progress-fill"></div>
        </div>

        <div class="bb-post hidden">
          <p class="bb-post-msg">${this.copy.postSession.calm}</p>
          <div class="bb-mood-row" role="group" aria-label="How do you feel?">
            ${MOOD_EMOJIS.map((e) => `<button class="bb-mood-btn" data-emoji="${e}" aria-label="${e}">${e}</button>`).join('')}
          </div>
          <button class="bb-btn bb-btn-primary bb-done">${this.copy.overlay.done}</button>
        </div>

        <div class="bb-skip-prompt hidden">
          <p class="bb-skip-msg">${this.copy.skipPrompt}</p>
          <div class="bb-skip-actions">
            <button class="bb-btn bb-skip-yes">${this.copy.overlay.yes}</button>
            <button class="bb-btn bb-skip-no">${this.copy.overlay.no}</button>
          </div>
        </div>
      </div>
    `;
  }

  private startSession(): void {
    if (!this.backdrop) return;

    const auraEl = this.backdrop.querySelector<SVGCircleElement>('.bb-aura')!;
    const counterEl = this.backdrop.querySelector<HTMLElement>('.bb-counter')!;
    const phaseLabel = this.backdrop.querySelector<HTMLElement>('.bb-phase-label')!;
    const progressFill = this.backdrop.querySelector<HTMLElement>('.bb-progress-fill')!;
    const progressBar = this.backdrop.querySelector<HTMLElement>('.bb-progress-bar')!;
    const postSection = this.backdrop.querySelector<HTMLElement>('.bb-post')!;
    const exitBtn = this.backdrop.querySelector<HTMLButtonElement>('.bb-exit')!;

    this.controller = new SessionController({
      onPhaseLabel: (label) => {
        phaseLabel.textContent = label;
        announceToScreenReader(this.shadow, label);
      },
      onTotalProgress: (progress) => {
        const pct = Math.round(progress * 100);
        progressFill.style.width = `${pct}%`;
        progressBar.setAttribute('aria-valuenow', String(pct));
      },
      onComplete: () => {
        phaseLabel.textContent = this.copy.postSession.calm;
        progressFill.style.width = '100%';
        postSection.classList.remove('hidden');
        exitBtn.classList.add('hidden');
        this.releaseFocusTrap?.();
        this.releaseFocusTrap = trapFocus(this.backdrop!.querySelector<HTMLElement>('.bb-card')!);
        this.wireMoodButtons();
        this.wirePostActions();
      },
      onAborted: () => {
        this.consecutiveSkips++;
        this.handleDismissalResponse();
      },
    });

    exitBtn.addEventListener('click', () => this.abort());

    // "Pet your character" — tap/click reaction
    const mascotEl = this.backdrop.querySelector<HTMLElement>('.bb-mascot')!;
    const HEARTS = ['❤️', '✨', '💜', '⭐️', '🌸'];
    let petCooldown = false;
    mascotEl.addEventListener('click', () => {
      if (petCooldown) return;
      petCooldown = true;
      mascotEl.classList.add('bb-petting');
      const heart = document.createElement('span');
      heart.className = 'bb-pet-heart';
      heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      mascotEl.appendChild(heart);
      setTimeout(() => { heart.remove(); mascotEl.classList.remove('bb-petting'); petCooldown = false; }, 700);
    });

    this.controller.start(auraEl, counterEl, this.shadow).catch(() => undefined);
  }

  private wireMoodButtons(): void {
    this.backdrop?.querySelectorAll<HTMLButtonElement>('.bb-mood-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji as MoodEmoji;
        this.controller?.recordMood(emoji);
        this.backdrop?.querySelectorAll('.bb-mood-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  private wirePostActions(): void {
    this.backdrop?.querySelector('.bb-done')?.addEventListener('click', () => this.hide());
  }

  private abort(): void {
    this.controller?.abort();
  }

  private async handleDismissalResponse(): Promise<void> {
    this.hide();
    try {
      const result = await chrome.runtime.sendMessage({ type: 'SESSION_DISMISSED' }) as
        | { autoSnooze: boolean }
        | undefined;
      if (result?.autoSnooze) {
        this.showToast('Paused for 30 minutes');
      } else if (this.consecutiveSkips >= 3) {
        this.showSkipPrompt();
      }
    } catch {
      // background context unavailable
    }
  }

  private showSkipPrompt(): void {
    const prompt = document.createElement('div');
    prompt.className = 'bb-skip-overlay';
    prompt.innerHTML = `
      <div class="bb-card">
        <p class="bb-skip-msg">${this.copy.skipPrompt}</p>
        <div class="bb-skip-actions">
          <button class="bb-btn bb-btn-primary bb-skip-yes">${this.copy.overlay.yes}</button>
          <button class="bb-btn bb-skip-no">${this.copy.overlay.no}</button>
        </div>
      </div>
    `;
    prompt.classList.add('bb-backdrop', 'visible');
    this.shadow.appendChild(prompt);

    const release = trapFocus(prompt);

    prompt.querySelector('.bb-skip-yes')?.addEventListener('click', async () => {
      release();
      prompt.remove();
      this.consecutiveSkips = 0;
      const msUntilMidnight =
        new Date(new Date().setHours(24, 0, 0, 0)).getTime() - Date.now();
      const minutes = Math.round(msUntilMidnight / 60_000);
      await chrome.runtime.sendMessage({ type: 'SNOOZE', minutes }).catch(() => undefined);
      this.showToast(this.copy.overlay.skipToday);
    });

    prompt.querySelector('.bb-skip-no')?.addEventListener('click', () => {
      release();
      prompt.remove();
    });
  }

  hide(): void {
    if (!this.backdrop) return;
    this.backdrop.classList.remove('visible');
    this.releaseFocusTrap?.();
    document.removeEventListener('keydown', this.handleKeyDown);
    setTimeout(() => {
      this.backdrop?.remove();
      this.backdrop = null;
      this.controller = null;
    }, 300);
  }

  showToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'bb-toast';
    toast.textContent = message;
    this.shadow.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.altKey && e.shiftKey && e.key === 'B') this.abort();
  };
}

customElements.define('breath-break-overlay', BreathBreakOverlay);
