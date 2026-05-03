import type { PhaseLabel } from './breathing-engine';

const SCALE_MIN = 1.0;
const SCALE_MAX = 1.15;

// Maps phase + progress → aura scale
function computeScale(label: PhaseLabel, phaseProgress: number): number {
  switch (label) {
    case 'inhale':
      return SCALE_MIN + (SCALE_MAX - SCALE_MIN) * phaseProgress;
    case 'holdIn':
      return SCALE_MAX;
    case 'exhale':
      return SCALE_MAX - (SCALE_MAX - SCALE_MIN) * phaseProgress;
    case 'holdOut':
      return SCALE_MIN;
  }
}

export class Pacer {
  private auraEl: SVGCircleElement | null = null;
  private counterEl: HTMLElement | null = null;
  private reducedMotion: boolean;
  private currentPhase: PhaseLabel = 'inhale';
  private phaseSecondsLeft = 0;
  private phaseSeconds = 0;

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
  }

  /** Attach to existing elements in the shadow DOM */
  attach(auraEl: SVGCircleElement, counterEl: HTMLElement): void {
    this.auraEl = auraEl;
    this.counterEl = counterEl;
  }

  onPhaseChange(label: PhaseLabel, phaseSeconds: number): void {
    this.currentPhase = label;
    this.phaseSeconds = phaseSeconds;
    this.phaseSecondsLeft = phaseSeconds;
    if (this.reducedMotion && this.counterEl) {
      this.counterEl.textContent = String(Math.ceil(phaseSeconds));
    }
  }

  onTick(phaseProgress: number, _totalProgress: number): void {
    this.phaseSecondsLeft = this.phaseSeconds * (1 - phaseProgress);

    if (this.reducedMotion) {
      if (this.counterEl) {
        this.counterEl.textContent = String(Math.ceil(this.phaseSecondsLeft));
      }
      return;
    }

    if (this.auraEl) {
      const scale = computeScale(this.currentPhase, phaseProgress);
      this.auraEl.setAttribute('r', String(54 * scale));
    }
  }

  reset(): void {
    if (this.auraEl) this.auraEl.setAttribute('r', '54');
    if (this.counterEl) this.counterEl.textContent = '';
  }
}

export { computeScale };
