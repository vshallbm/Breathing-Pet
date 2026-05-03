import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDaysSinceInstall, getRampIntervalMinutes, getDailyLimit } from '../src/background/ramp';

const INSTALLED = '2026-01-01T00:00:00.000Z';
const day = (n: number) => new Date(new Date(INSTALLED).getTime() + n * 86_400_000);

describe('getDaysSinceInstall', () => {
  it('returns 0 on same day', () => { expect(getDaysSinceInstall(INSTALLED, day(0))).toBe(0); });
  it('returns 3 after 3 days', () => { expect(getDaysSinceInstall(INSTALLED, day(3))).toBe(3); });
});

describe('getRampIntervalMinutes — adaptive', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(INSTALLED)); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns null on days 0–2 (daily alarm)', () => {
    expect(getRampIntervalMinutes(INSTALLED, 'adaptive', null)).toBe(null);
  });
  it('returns 25 after day 7', () => {
    vi.setSystemTime(day(8));
    expect(getRampIntervalMinutes(INSTALLED, 'adaptive', null)).toBe(25);
  });
  it('manual override wins always', () => {
    expect(getRampIntervalMinutes(INSTALLED, 'adaptive', 15)).toBe(15);
  });
});

describe('getDailyLimit', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(INSTALLED)); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns 1 on day 0 (adaptive)', () => { expect(getDailyLimit(INSTALLED, 'adaptive')).toBe(1); });
  it('returns null after day 7 (adaptive)', () => {
    vi.setSystemTime(day(10));
    expect(getDailyLimit(INSTALLED, 'adaptive')).toBeNull();
  });
});
