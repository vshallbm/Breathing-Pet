export type PhaseLabel = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export interface PhaseStep {
  label: PhaseLabel;
  seconds: number;
}

export interface BreathingPattern {
  id: string;
  label: string;
  phases: PhaseStep[];
}

type EngineState = 'idle' | 'running' | 'complete' | 'aborted';

export interface EngineCallbacks {
  onPhaseChange?: (label: PhaseLabel, phaseIndex: number) => void;
  onTick?: (phaseProgress: number, totalProgress: number) => void;
  onComplete?: () => void;
  onAborted?: () => void;
}

export class BreathingEngine {
  private state: EngineState = 'idle';
  private rafId: number | null = null;
  private startTime = 0;
  private lastPhaseIndex = -1;
  private readonly sessionDurationMs: number;
  private readonly cycleDurationMs: number;
  private readonly callbacks: EngineCallbacks;

  readonly pattern: BreathingPattern;

  constructor(
    pattern: BreathingPattern,
    sessionDurationSeconds: number,
    callbacks: EngineCallbacks = {},
  ) {
    this.pattern = pattern;
    this.sessionDurationMs = sessionDurationSeconds * 1000;
    this.cycleDurationMs = pattern.phases.reduce((sum, p) => sum + p.seconds * 1000, 0);
    this.callbacks = callbacks;
  }

  get currentState(): EngineState {
    return this.state;
  }

  start(): void {
    if (this.state !== 'idle') return;
    this.state = 'running';
    this.startTime = performance.now();
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }

  abort(): void {
    if (this.state !== 'running') return;
    this.state = 'aborted';
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.callbacks.onAborted?.();
  }

  private tick(now: number): void {
    if (this.state !== 'running') return;

    const elapsed = now - this.startTime;

    if (elapsed >= this.sessionDurationMs) {
      this.state = 'complete';
      this.callbacks.onTick?.(1, 1);
      this.callbacks.onComplete?.();
      return;
    }

    const { phaseIndex, phaseProgress } = this.resolvePhase(elapsed);
    const totalProgress = elapsed / this.sessionDurationMs;

    if (phaseIndex !== this.lastPhaseIndex) {
      this.lastPhaseIndex = phaseIndex;
      this.callbacks.onPhaseChange?.(this.pattern.phases[phaseIndex].label, phaseIndex);
    }

    this.callbacks.onTick?.(phaseProgress, totalProgress);

    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }

  resolvePhase(elapsedMs: number): { phaseIndex: number; phaseProgress: number } {
    const posInCycle = elapsedMs % this.cycleDurationMs;
    let accumulated = 0;

    for (let i = 0; i < this.pattern.phases.length; i++) {
      const phaseDurationMs = this.pattern.phases[i].seconds * 1000;
      if (posInCycle < accumulated + phaseDurationMs) {
        const phaseProgress = (posInCycle - accumulated) / phaseDurationMs;
        return { phaseIndex: i, phaseProgress };
      }
      accumulated += phaseDurationMs;
    }

    // Fallback to last phase (floating-point edge at exact cycle boundary)
    const last = this.pattern.phases.length - 1;
    return { phaseIndex: last, phaseProgress: 1 };
  }
}
