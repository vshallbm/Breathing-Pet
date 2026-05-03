import { describe, it, expect, vi } from 'vitest';
import { validateKeyFormat, applyLicenseKey, allUnlockedForTier } from '../src/premium/subscription';

// openCheckout uses chrome.tabs — stub it so module loads cleanly
vi.stubGlobal('chrome', {
  tabs: { create: vi.fn() },
});

describe('validateKeyFormat', () => {
  it('accepts a valid plus key', () => {
    expect(validateKeyFormat('BB-ABCD-1234-EFGH')).toBe(true);
  });

  it('accepts a valid premium key (BB-P prefix)', () => {
    expect(validateKeyFormat('BB-PREM-1234-ABCD')).toBe(true);
  });

  it('is case-insensitive (normalises internally)', () => {
    expect(validateKeyFormat('bb-abcd-1234-efgh')).toBe(true);
  });

  it('rejects key with wrong segment count', () => {
    expect(validateKeyFormat('BB-ABCD-1234')).toBe(false);
    expect(validateKeyFormat('BB-ABCD-1234-EFGH-XXXX')).toBe(false);
  });

  it('rejects key with wrong prefix', () => {
    expect(validateKeyFormat('AA-ABCD-1234-EFGH')).toBe(false);
    expect(validateKeyFormat('ABCD-1234-EFGH-IJKL')).toBe(false);
  });

  it('rejects key with wrong segment length', () => {
    expect(validateKeyFormat('BB-ABC-1234-EFGH')).toBe(false);   // 3 chars
    expect(validateKeyFormat('BB-ABCDE-1234-EFGH')).toBe(false); // 5 chars
  });

  it('rejects key with lowercase letters after normalisation attempt with special chars', () => {
    expect(validateKeyFormat('BB-AB!D-1234-EFGH')).toBe(false);
    expect(validateKeyFormat('BB-AB D-1234-EFGH')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateKeyFormat('')).toBe(false);
  });

  it('trims whitespace before validation', () => {
    expect(validateKeyFormat('  BB-ABCD-1234-EFGH  ')).toBe(true);
  });
});

describe('applyLicenseKey', () => {
  it('returns plus tier for a BB-A key', async () => {
    const result = await applyLicenseKey('BB-ABCD-1234-EFGH');
    expect(result.ok).toBe(true);
    expect(result.tier).toBe('plus');
  });

  it('returns premium tier for a BB-P key', async () => {
    const result = await applyLicenseKey('BB-PREM-AAAA-BBBB');
    expect(result.ok).toBe(true);
    expect(result.tier).toBe('premium');
  });

  it('returns ok=false for an invalid format key', async () => {
    const result = await applyLicenseKey('INVALID-KEY');
    expect(result.ok).toBe(false);
    expect(result.tier).toBe('free');
    expect(result.error).toBeTruthy();
  });

  it('normalises lowercase input', async () => {
    const result = await applyLicenseKey('bb-abcd-1234-efgh');
    expect(result.ok).toBe(true);
    expect(result.tier).toBe('plus');
  });
});

describe('allUnlockedForTier', () => {
  it('returns only cat for free tier', () => {
    expect(allUnlockedForTier('free')).toEqual(['cat']);
  });

  it('returns 6 characters for plus tier', () => {
    const chars = allUnlockedForTier('plus');
    expect(chars).toHaveLength(6);
    expect(chars).toContain('cat');
    expect(chars).toContain('bunny');
  });

  it('returns all 9 characters for premium tier', () => {
    const chars = allUnlockedForTier('premium');
    expect(chars).toHaveLength(9);
    expect(chars).toContain('axolotl');
    expect(chars).toContain('zen_frog');
    expect(chars).toContain('otter');
  });

  it('premium includes everything in plus', () => {
    const plus = new Set(allUnlockedForTier('plus'));
    const premium = allUnlockedForTier('premium');
    for (const c of plus) {
      expect(premium).toContain(c);
    }
  });
});
