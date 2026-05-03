import { isInjectableUrl } from '../lib/guards';

export async function triggerBreakOnActiveTab(): Promise<{ ok: boolean }> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !tab.url || !isInjectableUrl(tab.url)) {
    return { ok: false };
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_OVERLAY' });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
