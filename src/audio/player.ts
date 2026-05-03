const FADE_STEP_MS = 20;
const MUSIC_VOLUME = 0.35; // ambient level during session

export class AudioPlayer {
  private el: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  /** Call once with the overlay's shadow root so the element stays isolated */
  attach(shadowRoot: ShadowRoot): void {
    if (this.el) return;
    const audio = document.createElement('audio');
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    shadowRoot.appendChild(audio);
    this.el = audio;
  }

  /** Play a looping music track, fading in over 300ms */
  async playMusic(url: string): Promise<void> {
    if (!this.el) return;
    this.clearFade();
    this.el.loop = true;
    this.el.volume = 0;
    this.el.src = url;
    try {
      await this.el.play();
    } catch {
      return; // autoplay blocked or empty placeholder — no-op
    }
    this.fadeTo(MUSIC_VOLUME, 300);
  }

  /** Play a one-shot voice clip; resolves when it finishes (or errors) */
  async playVoice(url: string): Promise<void> {
    if (!this.el) return;
    this.clearFade();
    this.el.loop = false;
    this.el.volume = 1;
    this.el.src = url;
    return new Promise<void>((resolve) => {
      if (!this.el) { resolve(); return; }
      const done = () => { this.el?.removeEventListener('ended', done); resolve(); };
      const err = () => { this.el?.removeEventListener('error', err); resolve(); };
      this.el.addEventListener('ended', done, { once: true });
      this.el.addEventListener('error', err, { once: true });
      this.el.play().catch(() => resolve());
    });
  }

  /** Play a one-shot chime at full volume */
  async playChime(url: string): Promise<void> {
    if (!this.el) return;
    this.clearFade();
    this.el.loop = false;
    this.el.volume = 1;
    this.el.src = url;
    return new Promise<void>((resolve) => {
      if (!this.el) { resolve(); return; }
      this.el.addEventListener('ended', () => resolve(), { once: true });
      this.el.addEventListener('error', () => resolve(), { once: true });
      this.el.play().catch(() => resolve());
    });
  }

  /** Fade out over durationMs then pause */
  fadeOut(durationMs = 300): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.el || this.el.paused) { resolve(); return; }
      this.fadeTo(0, durationMs, () => {
        this.el?.pause();
        resolve();
      });
    });
  }

  stop(): void {
    this.clearFade();
    if (this.el) {
      this.el.pause();
      this.el.src = '';
    }
  }

  private fadeTo(target: number, durationMs: number, onDone?: () => void): void {
    this.clearFade();
    if (!this.el) { onDone?.(); return; }
    const start = this.el.volume;
    const steps = Math.max(1, Math.round(durationMs / FADE_STEP_MS));
    const delta = (target - start) / steps;
    let step = 0;
    this.fadeTimer = setInterval(() => {
      step++;
      if (!this.el) { this.clearFade(); onDone?.(); return; }
      this.el.volume = Math.min(1, Math.max(0, start + delta * step));
      if (step >= steps) {
        this.clearFade();
        this.el.volume = target;
        onDone?.();
      }
    }, FADE_STEP_MS);
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }
}
