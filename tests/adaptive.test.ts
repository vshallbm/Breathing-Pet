import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyAdaptiveFactor } from '../src/background/adaptive';

// getAdaptiveFactor reads chrome.storage.local — test it via applyAdaptiveFactor
// and a manual storage-stubbed variant below.

describe('applyAdaptiveFactor', () => {
  it('reduces interval for heavy usage (factor 0.6)', () => {
    // 60-minute base interval → 36 min (clamped to max(15, 36))
    expect(applyAdaptiveFactor(60, 0.6)).toBe(36);
  });

  it('reduces interval for medium usage (factor 0.8)', () => {
    expect(applyAdaptiveFactor(60, 0.8)).toBe(48);
  });

  it('returns base interval for light usage (factor 1.0)', () => {
    expect(applyAdaptiveFactor(60, 1.0)).toBe(60);
  });

  it('enforces minimum of 15 minutes', () => {
    // 20-min base * 0.6 = 12 → clamped to 15
    expect(applyAdaptiveFactor(20, 0.6)).toBe(15);
  });

  it('rounds to nearest minute', () => {
    // 25 * 0.8 = 20 — already whole number
    expect(applyAdaptiveFactor(25, 0.8)).toBe(20);
    // 30 * 0.6 = 18
    expect(applyAdaptiveFactor(30, 0.6)).toBe(18);
  });

  it('handles factor > 1 (hypothetical back-off)', () => {
    expect(applyAdaptiveFactor(30, 1.5)).toBe(45);
  });

  it('never returns below minimum even with tiny interval', () => {
    expect(applyAdaptiveFactor(1, 0.6)).toBe(15);
    expect(applyAdaptiveFactor(0, 1.0)).toBe(15);
  });
});

describe('getAdaptiveFactor — via chrome.storage stub', () => {
  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.stubGlobal('chrome', chromeMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('returns 0.6 for heavy scroll day (≥ 30 min)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    chromeMock.storage.local.get.mockResolvedValue({
      activeScrollSeconds: 31 * 60,
      lastScrollDate: today,
    });
    const { getAdaptiveFactor } = await import('../src/background/adaptive');
    expect(await getAdaptiveFactor()).toBe(0.6);
  });

  it('returns 0.8 for medium scroll day (10–29 min)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    chromeMock.storage.local.get.mockResolvedValue({
      activeScrollSeconds: 15 * 60,
      lastScrollDate: today,
    });
    const { getAdaptiveFactor } = await import('../src/background/adaptive');
    expect(await getAdaptiveFactor()).toBe(0.8);
  });

  it('returns 1.0 for light scroll day (< 10 min)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    chromeMock.storage.local.get.mockResolvedValue({
      activeScrollSeconds: 5 * 60,
      lastScrollDate: today,
    });
    const { getAdaptiveFactor } = await import('../src/background/adaptive');
    expect(await getAdaptiveFactor()).toBe(1.0);
  });

  it('returns 1.0 when date is yesterday (resets to 0)', async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    chromeMock.storage.local.get.mockResolvedValue({
      activeScrollSeconds: 60 * 60,
      lastScrollDate: yesterday,
    });
    const { getAdaptiveFactor } = await import('../src/background/adaptive');
    expect(await getAdaptiveFactor()).toBe(1.0);
  });

  it('returns 1.0 on storage error', async () => {
    chromeMock.storage.local.get.mockRejectedValue(new Error('storage error'));
    const { getAdaptiveFactor } = await import('../src/background/adaptive');
    expect(await getAdaptiveFactor()).toBe(1.0);
  });
});
