// Background-side only — uses chrome.scripting which is unavailable in content scripts.
// Content scripts send DUCK_TABS / RESTORE_TABS messages; service-worker calls these.

const DUCK_VOLUME = 0.6;
const DUCK_HOSTNAMES = [
  'open.spotify.com',
  'spotify.com',
  'youtube.com',
  'www.youtube.com',
];

// These functions are serialised by chrome.scripting.executeScript and run inside the tab.
function injectDuck(volume: number): void {
  document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((el) => {
    type Tracked = HTMLMediaElement & { _bbOrigVol?: number };
    (el as Tracked)._bbOrigVol ??= el.volume;
    el.volume = volume;
  });
}

function injectRestore(): void {
  document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((el) => {
    type Tracked = HTMLMediaElement & { _bbOrigVol?: number };
    const orig = (el as Tracked)._bbOrigVol;
    if (orig !== undefined) el.volume = orig;
  });
}

const duckedTabIds: number[] = [];

export async function duckTabs(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      try {
        const host = new URL(tab.url).hostname;
        if (!DUCK_HOSTNAMES.some((d) => host === d || host.endsWith(`.${d}`))) continue;
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: injectDuck,
          args: [DUCK_VOLUME],
        });
        duckedTabIds.push(tab.id);
      } catch {
        // Tab not injectable (chrome://, extension pages, etc.) — skip silently
      }
    }
  } catch {
    // scripting permission unavailable — no-op
  }
}

export async function restoreTabs(): Promise<void> {
  const ids = duckedTabIds.splice(0);
  for (const tabId of ids) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: injectRestore,
        args: [],
      });
    } catch {
      // Tab may have been closed — skip silently
    }
  }
}
