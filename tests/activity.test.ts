import { describe, it, expect, beforeEach } from 'vitest';
import { getAccumulatedSeconds, resetAccumulatedSeconds } from '../src/lib/activity';

describe('activity counter', () => {
  beforeEach(() => {
    resetAccumulatedSeconds();
  });

  it('starts at 0', () => {
    expect(getAccumulatedSeconds()).toBe(0);
  });

  it('resets to 0', () => {
    resetAccumulatedSeconds();
    expect(getAccumulatedSeconds()).toBe(0);
  });
});
