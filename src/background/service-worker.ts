import { initScheduler, handleAlarmFired, snooze, cancelSnooze } from './scheduler';
import { initDigestAlarm, sendWeeklyDigest } from './digest';
import { initNotificationListeners } from './notifications';
import { getSettings, saveSettings, recordDismissal } from '../lib/storage';
import { triggerBreakOnActiveTab } from './trigger-break';
import { duckTabs, restoreTabs } from '../audio/ducker';
import { shouldUnlockDog, checkMilestone } from '../characters/unlocks';
import { applySeasonalDrops } from '../characters/seasonal';
import { applyLicenseKey, allUnlockedForTier, openCheckout } from '../premium/subscription';
import { CHARACTER_REGISTRY } from '../characters/registry';
import type { MessageType } from '../types';

initNotificationListeners();

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const { DEFAULT_TARGET_SITES } = await import('../data/default-target-sites');
    await saveSettings({ targetSites: DEFAULT_TARGET_SITES, installedAt: new Date().toISOString() });
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/onboarding.html') });
  }
  await initScheduler();
  await initDigestAlarm();
  await checkAndApplySeasonalDrops();
});

chrome.runtime.onStartup.addListener(async () => {
  await initScheduler();
  await initDigestAlarm();
  await checkAndApplySeasonalDrops();
});

async function checkAndApplySeasonalDrops(): Promise<void> {
  const settings = await getSettings();
  const { updated, newDrops } = await applySeasonalDrops(settings.unlockedCharacters);
  if (!newDrops.length) return;
  await saveSettings({ unlockedCharacters: updated });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    for (const id of newDrops) {
      const def = CHARACTER_REGISTRY.find(c => c.id === id);
      if (def) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CHARACTER_UNLOCK', characterId: id, characterLabel: `${def.label} (seasonal)`,
        }).catch(() => undefined);
      }
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'breath-break-tick') {
    await handleAlarmFired();
  }
  if (alarm.name === 'breath-break-digest') {
    await sendWeeklyDigest();
  }
});

chrome.runtime.onMessage.addListener((msg: MessageType, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'SESSION_DISMISSED': {
        const { autoSnooze } = await recordDismissal();
        if (autoSnooze) {
          await snooze(30);
          sendResponse({ autoSnooze: true });
        } else {
          sendResponse({ autoSnooze: false });
        }
        break;
      }
      case 'SESSION_COMPLETE': {
        const settings = await getSettings();
        const today = new Date().toISOString().slice(0, 10);
        const todaySessions = settings.streak.lastSessionDate === today
          ? settings.streak.todaySessions + 1
          : 1;
        const newTotal = settings.streak.totalSessions + 1;
        await saveSettings({
          streak: { totalSessions: newTotal, todaySessions, lastSessionDate: today },
        });

        // Only Dog unlocks via session count (at 7). All Plus/Premium characters unlock at subscription.
        const unlocked = new Set(settings.unlockedCharacters);
        const newlyUnlocked: string[] = [];
        if (shouldUnlockDog(newTotal) && !unlocked.has('dog')) newlyUnlocked.push('dog');
        checkMilestone(newTotal); // milestone number available for future accessory unlocks

        if (newlyUnlocked.length) {
          const updated = [...unlocked, ...newlyUnlocked];
          await saveSettings({ unlockedCharacters: updated });
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab?.id) {
            for (const id of newlyUnlocked) {
              const def = CHARACTER_REGISTRY.find((c) => c.id === id);
              if (def) {
                chrome.tabs.sendMessage(activeTab.id, {
                  type: 'CHARACTER_UNLOCK',
                  characterId: id,
                  characterLabel: def.label,
                }).catch(() => undefined);
              }
            }
          }
        }

        sendResponse({ ok: true });
        break;
      }
      case 'SNOOZE': {
        await snooze(msg.minutes);
        sendResponse({ ok: true });
        break;
      }
      case 'TOGGLE_ENABLED': {
        await saveSettings({ enabled: msg.enabled });
        if (msg.enabled) await cancelSnooze();
        sendResponse({ ok: true });
        break;
      }
      case 'GET_STATUS': {
        const s = await getSettings();
        const today = new Date().toISOString().slice(0, 10);
        const alarm = await chrome.alarms.get('breath-break-tick');
        const nextAlarmMs = alarm?.scheduledTime ?? null;
        sendResponse({
          snoozedUntil: s.snoozedUntil,
          enabled: s.enabled,
          intervalMinutes: s.manualIntervalMinutes,
          todaySessions: s.streak.lastSessionDate === today ? s.streak.todaySessions : 0,
          totalSessions: s.streak.totalSessions,
          character: s.character,
          nextAlarmMs,
        });
        break;
      }
      case 'DUCK_TABS': {
        await duckTabs();
        sendResponse({ ok: true });
        break;
      }
      case 'RESTORE_TABS': {
        await restoreTabs();
        sendResponse({ ok: true });
        break;
      }
      case 'APPLY_LICENSE': {
        const result = await applyLicenseKey(msg.key);
        if (result.ok) {
          const unlocked = allUnlockedForTier(result.tier);
          await saveSettings({
            tier: result.tier,
            isPremium: result.tier !== 'free',
            lifetimeUnlocked: true,
            unlockedCharacters: unlocked,
          });
        }
        sendResponse(result);
        break;
      }
      case 'OPEN_CHECKOUT': {
        openCheckout();
        sendResponse({ ok: true });
        break;
      }
      case 'TRIGGER_BREAK': {
        sendResponse(await triggerBreakOnActiveTab());
        break;
      }
      case 'SETTINGS_UPDATED': {
        // If buddyMode changed, tell all injectable tabs
        if (msg.settings.buddyMode !== undefined) {
          const tabs = await chrome.tabs.query({});
          for (const tab of tabs) {
            if (!tab.id) continue;
            const type = msg.settings.buddyMode ? 'BUDDY_START' : 'BUDDY_STOP';
            chrome.tabs.sendMessage(tab.id, { type }).catch(() => undefined);
          }
        }
        sendResponse({ ok: true });
        break;
      }
    }
  })();
  return true;
});
