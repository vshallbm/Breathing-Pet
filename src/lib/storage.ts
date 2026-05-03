import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

type LocalKeys = Pick<Settings, 'streak' | 'moodHistory' | 'snoozedUntil'> & {
  consecutiveDismissals: number;
  lastDismissalTime: number | null;
  activeScrollSeconds: number;
  lastScrollDate: string | null;
};

export async function getSettings(): Promise<Settings> {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get(['streak', 'moodHistory', 'snoozedUntil'])
  ]);
  const base = { ...DEFAULT_SETTINGS, ...sync };
  base.streak = (local['streak'] as Settings['streak']) ?? DEFAULT_SETTINGS.streak;
  base.moodHistory = (local['moodHistory'] as Settings['moodHistory']) ?? [];
  base.snoozedUntil = (local['snoozedUntil'] as string | null) ?? null;
  return base as Settings;
}

export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  const { streak, moodHistory, snoozedUntil, ...syncPart } = partial;
  const localPart: Partial<LocalKeys> = {};
  if (streak !== undefined) localPart.streak = streak;
  if (moodHistory !== undefined) localPart.moodHistory = moodHistory;
  if (snoozedUntil !== undefined) localPart.snoozedUntil = snoozedUntil;
  if (Object.keys(syncPart).length) await chrome.storage.sync.set(syncPart);
  if (Object.keys(localPart).length) await chrome.storage.local.set(localPart);
}

export async function getLocal<K extends keyof LocalKeys>(key: K): Promise<LocalKeys[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as LocalKeys[K] | undefined;
}

export async function setLocal<K extends keyof LocalKeys>(key: K, value: LocalKeys[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getDismissalState(): Promise<{ count: number; lastTime: number | null }> {
  const result = await chrome.storage.local.get(['consecutiveDismissals', 'lastDismissalTime']);
  return {
    count: (result['consecutiveDismissals'] as number) ?? 0,
    lastTime: (result['lastDismissalTime'] as number | null) ?? null,
  };
}

export async function recordDismissal(): Promise<{ autoSnooze: boolean }> {
  const now = Date.now();
  const { count, lastTime } = await getDismissalState();
  const windowMs = 10 * 60 * 1000;
  const withinWindow = lastTime !== null && now - lastTime < windowMs;
  const newCount = withinWindow ? count + 1 : 1;
  await chrome.storage.local.set({ consecutiveDismissals: newCount, lastDismissalTime: now });
  if (newCount >= 3) {
    await chrome.storage.local.set({ consecutiveDismissals: 0 });
    return { autoSnooze: true };
  }
  return { autoSnooze: false };
}

export async function getActiveScrollSeconds(): Promise<number> {
  const result = await chrome.storage.local.get(['activeScrollSeconds', 'lastScrollDate']);
  const today = new Date().toISOString().slice(0, 10);
  if ((result['lastScrollDate'] as string) !== today) return 0;
  return (result['activeScrollSeconds'] as number) ?? 0;
}

export async function addActiveScrollSeconds(seconds: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getActiveScrollSeconds();
  await chrome.storage.local.set({ activeScrollSeconds: current + seconds, lastScrollDate: today });
}
