import type { Tier } from '../types';

const CHECKOUT_URL = 'https://breathbreak.app/checkout';

// License key format: BB-XXXX-XXXX-XXXX (Plus) or BB-PXXX-XXXX-XXXX (Premium)
const KEY_RE = /^BB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function openCheckout(): void {
  chrome.tabs.create({ url: CHECKOUT_URL });
}

export function validateKeyFormat(raw: string): boolean {
  return KEY_RE.test(raw.trim().toUpperCase());
}

export async function applyLicenseKey(
  raw: string,
): Promise<{ ok: boolean; tier: Tier; error?: string }> {
  const key = raw.trim().toUpperCase();
  if (!KEY_RE.test(key)) {
    return { ok: false, tier: 'free', error: 'Key must be in BB-XXXX-XXXX-XXXX format.' };
  }
  // Stub: keys starting with BB-P grant premium; all others grant plus.
  // Production: POST key to /api/verify and return server response.
  const tier: Tier = key.startsWith('BB-P') ? 'premium' : 'plus';
  return { ok: true, tier };
}

export function allUnlockedForTier(tier: Tier): string[] {
  if (tier === 'free') return ['cat'];
  if (tier === 'plus') return ['cat', 'dog', 'capybara', 'red_panda', 'bunny', 'penguin'];
  // premium
  return ['cat', 'dog', 'capybara', 'red_panda', 'bunny', 'penguin', 'axolotl', 'zen_frog', 'otter'];
}
