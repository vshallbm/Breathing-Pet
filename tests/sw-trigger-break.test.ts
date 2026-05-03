import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerBreakOnActiveTab } from '../src/background/trigger-break';

function makeChromeMock(
  queryResult: chrome.tabs.Tab[],
  sendMessageImpl: () => Promise<unknown> = () => Promise.resolve({}),
) {
  return {
    tabs: {
      query: vi.fn().mockResolvedValue(queryResult),
      sendMessage: vi.fn().mockImplementation(sendMessageImpl),
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('triggerBreakOnActiveTab', () => {
  it('returns ok:true when active https tab receives SHOW_OVERLAY', async () => {
    vi.stubGlobal('chrome', makeChromeMock([{ id: 1, url: 'https://example.com' } as chrome.tabs.Tab]));
    const result = await triggerBreakOnActiveTab();
    expect(result).toEqual({ ok: true });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'SHOW_OVERLAY' });
  });

  it('returns ok:false and skips sendMessage when active tab is chrome://newtab', async () => {
    vi.stubGlobal('chrome', makeChromeMock([{ id: 1, url: 'chrome://newtab/' } as chrome.tabs.Tab]));
    const result = await triggerBreakOnActiveTab();
    expect(result).toEqual({ ok: false });
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('returns ok:false when no active tab found', async () => {
    vi.stubGlobal('chrome', makeChromeMock([]));
    const result = await triggerBreakOnActiveTab();
    expect(result).toEqual({ ok: false });
  });

  it('returns ok:false when active tab has no url', async () => {
    vi.stubGlobal('chrome', makeChromeMock([{ id: 1, url: undefined } as unknown as chrome.tabs.Tab]));
    const result = await triggerBreakOnActiveTab();
    expect(result).toEqual({ ok: false });
  });

  it('returns ok:false when sendMessage throws (content script not injected)', async () => {
    vi.stubGlobal('chrome', makeChromeMock(
      [{ id: 1, url: 'https://example.com' } as chrome.tabs.Tab],
      () => Promise.reject(new Error('Could not establish connection.')),
    ));
    const result = await triggerBreakOnActiveTab();
    expect(result).toEqual({ ok: false });
  });

  it('uses lastFocusedWindow:true in the tabs query', async () => {
    vi.stubGlobal('chrome', makeChromeMock([]));
    await triggerBreakOnActiveTab();
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, lastFocusedWindow: true });
  });
});
