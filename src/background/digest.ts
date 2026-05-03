import { getSettings } from '../lib/storage';

const DIGEST_ALARM = 'breath-break-digest';
const NOTIF_ID     = 'breath-break-digest-notif';

export async function initDigestAlarm(): Promise<void> {
  const existing = await chrome.alarms.get(DIGEST_ALARM);
  if (existing) return;
  // Fire every 7 days from now
  chrome.alarms.create(DIGEST_ALARM, { periodInMinutes: 7 * 24 * 60 });
}

export async function sendWeeklyDigest(): Promise<void> {
  const settings = await getSettings();
  const total = settings.streak.totalSessions;

  // Count this week's moods
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekMoods = settings.moodHistory.filter(m => m.date.slice(0, 10) >= weekAgo);
  const moodCounts: Record<string, number> = {};
  for (const { emoji } of weekMoods) moodCounts[emoji] = (moodCounts[emoji] ?? 0) + 1;
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const sessionWord = weekMoods.length === 1 ? 'session' : 'sessions';
  let message = `${weekMoods.length} ${sessionWord} this week · ${total} total`;
  if (topMood) message += ` · Feeling ${topMood} most`;

  chrome.notifications.create(NOTIF_ID, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-48.png'),
    title: 'Breath Break — Weekly check-in 🐱',
    message,
    priority: 0,
  });
}
