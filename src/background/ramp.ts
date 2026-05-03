import type { RampPreset } from '../types';

const MS_PER_DAY = 86_400_000;

export function getDaysSinceInstall(installedAt: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(installedAt).getTime()) / MS_PER_DAY);
}

export function getRampIntervalMinutes(
  installedAt: string,
  preset: RampPreset,
  manualOverride: number | null
): number | null {
  if (manualOverride !== null) return manualOverride;
  const days = getDaysSinceInstall(installedAt);
  if (preset === 'slow') {
    if (days < 7) return null; // 1/day handled by scheduler via daily alarm
    return 60;
  }
  if (preset === 'ready') {
    if (days < 3) return null;
    return 25;
  }
  // adaptive (default)
  if (days < 3) return null;   // 1/day
  if (days < 7) return null;   // 2/day
  return 25; // every 30 active minutes ~ every 25 calendar minutes
}

export function getDailyLimit(installedAt: string, preset: RampPreset): number | null {
  if (preset === 'ready') return null;
  const days = getDaysSinceInstall(installedAt);
  if (preset === 'slow') {
    if (days < 7) return 1;
    return null;
  }
  if (days < 3) return 1;
  if (days < 7) return 2;
  return null;
}
