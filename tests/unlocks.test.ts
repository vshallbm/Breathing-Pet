import { describe, it, expect } from 'vitest';
import { checkMilestone, shouldUnlockDog } from '../src/characters/unlocks';

describe('checkMilestone', () => {
  it('returns 7 at exactly 7 sessions', () => {
    expect(checkMilestone(7)).toBe(7);
  });

  it('returns 30 at exactly 30 sessions', () => {
    expect(checkMilestone(30)).toBe(30);
  });

  it('returns 100 at exactly 100 sessions', () => {
    expect(checkMilestone(100)).toBe(100);
  });

  it('returns null before any milestone', () => {
    expect(checkMilestone(1)).toBeNull();
    expect(checkMilestone(6)).toBeNull();
  });

  it('returns null between milestones', () => {
    expect(checkMilestone(8)).toBeNull();
    expect(checkMilestone(29)).toBeNull();
    expect(checkMilestone(50)).toBeNull();
    expect(checkMilestone(99)).toBeNull();
  });

  it('returns null past last milestone', () => {
    expect(checkMilestone(101)).toBeNull();
    expect(checkMilestone(500)).toBeNull();
  });

  it('returns null at 0', () => {
    expect(checkMilestone(0)).toBeNull();
  });
});

describe('shouldUnlockDog', () => {
  it('returns false below threshold', () => {
    expect(shouldUnlockDog(0)).toBe(false);
    expect(shouldUnlockDog(6)).toBe(false);
  });

  it('returns true at threshold (7)', () => {
    expect(shouldUnlockDog(7)).toBe(true);
  });

  it('returns true above threshold', () => {
    expect(shouldUnlockDog(8)).toBe(true);
    expect(shouldUnlockDog(100)).toBe(true);
  });
});
