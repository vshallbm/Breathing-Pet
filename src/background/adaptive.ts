import { getActiveScrollSeconds } from '../lib/storage';

const MIN_INTERVAL_MINUTES = 15;
const HEAVY_SCROLL_THRESHOLD = 30 * 60;   // 30 min of scroll = heavy day
const MEDIUM_SCROLL_THRESHOLD = 10 * 60;  // 10 min of scroll = medium day

/**
 * Returns an interval adjustment factor based on today's scroll activity.
 * Heavy scrolling → more frequent breaks (factor < 1).
 * Light scrolling  → normal frequency (factor = 1).
 */
export async function getAdaptiveFactor(): Promise<number> {
  try {
    const seconds = await getActiveScrollSeconds();
    if (seconds >= HEAVY_SCROLL_THRESHOLD) return 0.6;
    if (seconds >= MEDIUM_SCROLL_THRESHOLD) return 0.8;
    return 1.0;
  } catch {
    return 1.0;
  }
}

/**
 * Applies the adaptive factor to a base interval, enforcing a minimum.
 */
export function applyAdaptiveFactor(baseMinutes: number, factor: number): number {
  return Math.max(MIN_INTERVAL_MINUTES, Math.round(baseMinutes * factor));
}
