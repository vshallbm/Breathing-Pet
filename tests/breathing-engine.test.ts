import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BreathingEngine } from '../src/content/breathing-engine';
import type { BreathingPattern } from '../src/content/breathing-engine';

// Stub rAF/cAF with synchronous fakes driven by manual advance
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafIdCounter = 0;
let now = 0;

function advanceTime(ms: number): void {
  now += ms;
  // Drain all pending rAF callbacks once
  const pending = new Map(rafCallbacks);
  rafCallbacks.clear();
  for (const cb of pending.values()) cb(now);
}

beforeEach(() => {
  rafCallbacks = new Map();
  rafIdCounter = 0;
  now = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = ++rafIdCounter;
    rafCallbacks.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCallbacks.delete(id);
  });
  vi.stubGlobal('performance', { now: () => now });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const BOX: BreathingPattern = {
  id: 'box_4_4_4_4',
  label: 'Box',
  phases: [
    { label: 'inhale', seconds: 4 },
    { label: 'holdIn', seconds: 4 },
    { label: 'exhale', seconds: 4 },
    { label: 'holdOut', seconds: 4 },
  ],
};

const SHORT: BreathingPattern = {
  id: 'short',
  label: 'Short',
  phases: [{ label: 'inhale', seconds: 1 }],
};

describe('BreathingEngine — initial state', () => {
  it('starts in idle state', () => {
    const engine = new BreathingEngine(BOX, 60);
    expect(engine.currentState).toBe('idle');
  });

  it('exposes the pattern', () => {
    const engine = new BreathingEngine(BOX, 60);
    expect(engine.pattern.id).toBe('box_4_4_4_4');
  });
});

describe('BreathingEngine — start', () => {
  it('transitions to running on start()', () => {
    const engine = new BreathingEngine(BOX, 60);
    engine.start();
    expect(engine.currentState).toBe('running');
  });

  it('ignores duplicate start() calls', () => {
    const onPhaseChange = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onPhaseChange });
    engine.start();
    engine.start(); // second call should be a no-op
    advanceTime(100);
    // onPhaseChange fires once for the first RAF tick, not twice
    expect(onPhaseChange).toHaveBeenCalledTimes(1);
  });
});

describe('BreathingEngine — phase progression', () => {
  it('fires onPhaseChange with inhale on first tick', () => {
    const onPhaseChange = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onPhaseChange });
    engine.start();
    advanceTime(100); // 100ms into inhale phase
    expect(onPhaseChange).toHaveBeenCalledWith('inhale', 0);
  });

  it('fires onPhaseChange for each new phase', () => {
    const phases: string[] = [];
    const engine = new BreathingEngine(BOX, 60, {
      onPhaseChange: (label) => phases.push(label),
    });
    engine.start();
    advanceTime(100);   // inhale
    advanceTime(4000);  // → holdIn
    advanceTime(4000);  // → exhale
    advanceTime(4000);  // → holdOut
    expect(phases).toEqual(['inhale', 'holdIn', 'exhale', 'holdOut']);
  });

  it('does not re-fire onPhaseChange within the same phase', () => {
    const onPhaseChange = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onPhaseChange });
    engine.start();
    advanceTime(100);
    advanceTime(500); // still in inhale
    expect(onPhaseChange).toHaveBeenCalledTimes(1);
  });

  it('wraps cycle correctly for coherent pattern', () => {
    const coherent: BreathingPattern = {
      id: 'coherent_5_5', label: 'Coherent',
      phases: [{ label: 'inhale', seconds: 5 }, { label: 'exhale', seconds: 5 }],
    };
    const phases: string[] = [];
    const engine = new BreathingEngine(coherent, 20, {
      onPhaseChange: (label) => phases.push(label),
    });
    engine.start();
    advanceTime(100);   // inhale cycle 1
    advanceTime(5000);  // exhale cycle 1
    advanceTime(5000);  // inhale cycle 2
    advanceTime(5000);  // exhale cycle 2
    expect(phases).toEqual(['inhale', 'exhale', 'inhale', 'exhale']);
  });
});

describe('BreathingEngine — tick callback', () => {
  it('fires onTick with phaseProgress in [0,1]', () => {
    const ticks: number[] = [];
    const engine = new BreathingEngine(BOX, 60, {
      onTick: (phaseProgress) => ticks.push(phaseProgress),
    });
    engine.start();
    advanceTime(2000); // 2s into 4s inhale → phaseProgress ≈ 0.5
    expect(ticks[0]).toBeGreaterThan(0);
    expect(ticks[0]).toBeLessThan(1);
  });

  it('fires onTick with totalProgress increasing', () => {
    const totals: number[] = [];
    const engine = new BreathingEngine(BOX, 60, {
      onTick: (_pp, tp) => totals.push(tp),
    });
    engine.start();
    advanceTime(100);
    advanceTime(10000);
    expect(totals[totals.length - 1]).toBeGreaterThan(totals[0]);
  });
});

describe('BreathingEngine — completion', () => {
  it('calls onComplete and transitions to complete after session duration', () => {
    const onComplete = vi.fn();
    const onTick = vi.fn();
    const engine = new BreathingEngine(SHORT, 1, { onComplete, onTick });
    engine.start();
    advanceTime(1001); // past the 1-second session
    expect(engine.currentState).toBe('complete');
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Final tick should have progress = 1
    const lastCall = onTick.mock.calls[onTick.mock.calls.length - 1] as [number, number];
    expect(lastCall[1]).toBe(1);
  });

  it('does not fire further ticks after completion', () => {
    const onTick = vi.fn();
    const engine = new BreathingEngine(SHORT, 1, { onTick });
    engine.start();
    advanceTime(1001);
    const countAfterComplete = onTick.mock.calls.length;
    advanceTime(500); // no more RAF scheduled
    expect(onTick.mock.calls.length).toBe(countAfterComplete);
  });
});

describe('BreathingEngine — abort', () => {
  it('calls onAborted and transitions to aborted', () => {
    const onAborted = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onAborted });
    engine.start();
    advanceTime(1000);
    engine.abort();
    expect(engine.currentState).toBe('aborted');
    expect(onAborted).toHaveBeenCalledTimes(1);
  });

  it('ignores abort() when not running (idle)', () => {
    const onAborted = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onAborted });
    engine.abort(); // called before start
    expect(onAborted).not.toHaveBeenCalled();
    expect(engine.currentState).toBe('idle');
  });

  it('ignores abort() after completion', () => {
    const onAborted = vi.fn();
    const engine = new BreathingEngine(SHORT, 1, { onAborted });
    engine.start();
    advanceTime(1001); // complete
    engine.abort();
    expect(onAborted).not.toHaveBeenCalled();
    expect(engine.currentState).toBe('complete');
  });

  it('stops scheduling rAF after abort', () => {
    const onTick = vi.fn();
    const engine = new BreathingEngine(BOX, 60, { onTick });
    engine.start();
    advanceTime(500);
    engine.abort();
    const countAtAbort = onTick.mock.calls.length;
    advanceTime(500); // no new rAF queued
    expect(onTick.mock.calls.length).toBe(countAtAbort);
  });
});

describe('BreathingEngine — resolvePhase', () => {
  it('wraps back to phase 0 at exact cycle boundary', () => {
    const engine = new BreathingEngine(BOX, 60);
    // 16 000ms % 16 000ms = 0 → start of next cycle = phase 0
    const { phaseIndex } = engine.resolvePhase(16_000);
    expect(phaseIndex).toBe(0);
  });

  it('resolves mid-phase progress correctly', () => {
    const engine = new BreathingEngine(BOX, 60);
    // 6000ms into cycle: inhale(4000) + holdIn starts at 4000, so 2000ms into holdIn
    const { phaseIndex, phaseProgress } = engine.resolvePhase(6000);
    expect(phaseIndex).toBe(1); // holdIn
    expect(phaseProgress).toBeCloseTo(0.5, 5);
  });
});
