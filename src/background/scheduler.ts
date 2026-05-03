import { getSettings, saveSettings } from '../lib/storage';
import { getRampIntervalMinutes, getDailyLimit } from './ramp';
import { getAdaptiveFactor, applyAdaptiveFactor } from './adaptive';
import { isInjectableUrl } from '../lib/guards';
import { notifyViaNotification } from './notifications';

const ALARM_NAME = 'breath-break-tick';

export async function initScheduler(): Promise<void> {
  await restoreOrScheduleAlarm();
}

export async function restoreOrScheduleAlarm(): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;
  const snoozed = settings.snoozedUntil && new Date(settings.snoozedUntil) > new Date();
  if (snoozed) {
    const snoozeUntil = new Date(settings.snoozedUntil!);
    const delayMs = snoozeUntil.getTime() - Date.now();
    await chrome.alarms.create(ALARM_NAME, { delayInMinutes: Math.max(1, delayMs / 60_000) });
    return;
  }
  let intervalMinutes = getRampIntervalMinutes(settings.installedAt, settings.rampPreset, settings.manualIntervalMinutes);
  if (intervalMinutes === null) {
    await scheduleDailyAlarm();
  } else {
    if (settings.rampPreset === 'adaptive') {
      const factor = await getAdaptiveFactor();
      intervalMinutes = applyAdaptiveFactor(intervalMinutes, factor);
    }
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: intervalMinutes });
  }
}

async function scheduleDailyAlarm(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const delayMs = tomorrow.getTime() - Date.now();
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes: Math.max(1, delayMs / 60_000) });
}

export async function handleAlarmFired(): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;
  const snoozed = settings.snoozedUntil && new Date(settings.snoozedUntil) > new Date();
  if (snoozed) return;
  const dailyLimit = getDailyLimit(settings.installedAt, settings.rampPreset);
  if (dailyLimit !== null && settings.streak.todaySessions >= dailyLimit) return;
  await notifyActiveTabOnTargetSite(settings.targetSites.concat(settings.customSites), settings.everywhereMode);
  await restoreOrScheduleAlarm();
}

async function notifyActiveTabOnTargetSite(targetSites: string[], everywhereMode: boolean): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id || !activeTab.url) return;

  if (!isInjectableUrl(activeTab.url)) {
    if (everywhereMode) notifyViaNotification();
    return;
  }

  try {
    const url = new URL(activeTab.url);
    if (!everywhereMode) {
      const hostname = url.hostname.replace(/^www\./, '');
      const isTarget = targetSites.some(site => hostname === site || hostname.endsWith(`.${site}`));
      if (!isTarget) return;
    }
    await chrome.tabs.sendMessage(activeTab.id, { type: 'SHOW_OVERLAY' });
  } catch {
    // tab not injectable (defensive net for edge cases)
  }
}

export async function snooze(minutes: number): Promise<void> {
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  await saveSettings({ snoozedUntil: until });
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes: minutes });
}

export async function cancelSnooze(): Promise<void> {
  await saveSettings({ snoozedUntil: null });
  await chrome.alarms.clear(ALARM_NAME);
  await restoreOrScheduleAlarm();
}
