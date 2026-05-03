import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getActiveSeasonalDrops, applySeasonalDrops } from '../src/characters/seasonal';

function setDate(mmDD: string): void {
  const [mm, dd] = mmDD.split('-').map(Number);
  const d = new Date(2026, (mm as number) - 1, dd as number, 12, 0, 0);
  vi.setSystemTime(d);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getActiveSeasonalDrops', () => {
  it('returns zen_frog in spring (Apr 01)', () => {
    setDate('04-01');
    expect(getActiveSeasonalDrops()).toContain('zen_frog');
  });

  it('returns otter in summer (Jul 15)', () => {
    setDate('07-15');
    expect(getActiveSeasonalDrops()).toContain('otter');
  });

  it('returns red_panda in autumn (Oct 31)', () => {
    setDate('10-31');
    expect(getActiveSeasonalDrops()).toContain('red_panda');
  });

  it('returns penguin in winter (Jan 01 — year-wrap)', () => {
    setDate('01-01');
    expect(getActiveSeasonalDrops()).toContain('penguin');
  });

  it('returns penguin in winter (Dec 25)', () => {
    setDate('12-25');
    expect(getActiveSeasonalDrops()).toContain('penguin');
  });

  it('returns only one character per season', () => {
    setDate('04-01');
    const drops = getActiveSeasonalDrops();
    expect(drops.length).toBe(1);
  });

  it('does not include penguin in summer', () => {
    setDate('07-15');
    expect(getActiveSeasonalDrops()).not.toContain('penguin');
  });

  it('does not include zen_frog in winter', () => {
    setDate('01-15');
    expect(getActiveSeasonalDrops()).not.toContain('zen_frog');
  });

  it('returns zen_frog on spring start boundary (Mar 20)', () => {
    setDate('03-20');
    expect(getActiveSeasonalDrops()).toContain('zen_frog');
  });

  it('returns zen_frog on spring end boundary (Jun 20)', () => {
    setDate('06-20');
    expect(getActiveSeasonalDrops()).toContain('zen_frog');
  });

  it('returns otter on summer start boundary (Jun 21)', () => {
    setDate('06-21');
    expect(getActiveSeasonalDrops()).toContain('otter');
  });

  it('returns penguin on winter start boundary (Dec 21)', () => {
    setDate('12-21');
    expect(getActiveSeasonalDrops()).toContain('penguin');
  });
});

describe('applySeasonalDrops', () => {
  it('adds new seasonal character to unlocked list', async () => {
    setDate('04-01'); // spring → zen_frog
    const { updated, newDrops } = await applySeasonalDrops(['cat', 'dog']);
    expect(newDrops).toContain('zen_frog');
    expect(updated).toContain('zen_frog');
  });

  it('does not duplicate already-unlocked seasonal character', async () => {
    setDate('04-01');
    const { newDrops } = await applySeasonalDrops(['cat', 'zen_frog']);
    expect(newDrops).toHaveLength(0);
  });

  it('preserves all existing unlocked characters', async () => {
    setDate('07-15'); // summer → otter
    const { updated } = await applySeasonalDrops(['cat', 'dog', 'bunny']);
    expect(updated).toContain('cat');
    expect(updated).toContain('dog');
    expect(updated).toContain('bunny');
  });

  it('returns same array reference when no new drops', async () => {
    setDate('04-01');
    const input = ['cat', 'zen_frog'];
    const { updated } = await applySeasonalDrops(input);
    expect(updated).toBe(input);
  });
});
