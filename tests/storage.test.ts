import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// chrome.storage.local mock — simple in-memory store
function makeStorageMock() {
  const store: Record<string, unknown> = {};
  return {
    get: vi.fn(async (keys: string | string[] | null) => {
      if (!keys) return { ...store };
      const ks = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(ks.map(k => [k, store[k]]));
    }),
    set: vi.fn(async (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
    }),
    clear: vi.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    _store: store,
  };
}

// chrome.storage.sync mock (minimal — only used by getSettings)
function makeSyncMock() {
  return {
    get: vi.fn(async () => ({})),
    set: vi.fn(async () => undefined),
  };
}

let localMock: ReturnType<typeof makeStorageMock>;
let syncMock: ReturnType<typeof makeSyncMock>;

beforeEach(() => {
  localMock = makeStorageMock();
  syncMock = makeSyncMock();
  vi.stubGlobal('chrome', {
    storage: { local: localMock, sync: syncMock },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getActiveScrollSeconds', () => {
  it('returns 0 when no data stored', async () => {
    localMock.get.mockResolvedValue({});
    const { getActiveScrollSeconds } = await import('../src/lib/storage');
    expect(await getActiveScrollSeconds()).toBe(0);
  });

  it('returns 0 when date is yesterday', async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    localMock.get.mockResolvedValue({ activeScrollSeconds: 1000, lastScrollDate: yesterday });
    const { getActiveScrollSeconds } = await import('../src/lib/storage');
    expect(await getActiveScrollSeconds()).toBe(0);
  });

  it('returns stored value when date is today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    localMock.get.mockResolvedValue({ activeScrollSeconds: 500, lastScrollDate: today });
    const { getActiveScrollSeconds } = await import('../src/lib/storage');
    expect(await getActiveScrollSeconds()).toBe(500);
  });
});

describe('addActiveScrollSeconds', () => {
  it('adds delta to existing seconds', async () => {
    const today = new Date().toISOString().slice(0, 10);
    localMock.get.mockResolvedValue({ activeScrollSeconds: 100, lastScrollDate: today });
    const { addActiveScrollSeconds } = await import('../src/lib/storage');
    await addActiveScrollSeconds(50);
    expect(localMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeScrollSeconds: 150, lastScrollDate: today }),
    );
  });

  it('starts from 0 on a new day', async () => {
    localMock.get.mockResolvedValue({}); // no previous data
    const { addActiveScrollSeconds } = await import('../src/lib/storage');
    await addActiveScrollSeconds(30);
    const today = new Date().toISOString().slice(0, 10);
    expect(localMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeScrollSeconds: 30, lastScrollDate: today }),
    );
  });
});

describe('getDismissalState', () => {
  it('returns zeros when nothing stored', async () => {
    localMock.get.mockResolvedValue({});
    const { getDismissalState } = await import('../src/lib/storage');
    const state = await getDismissalState();
    expect(state.count).toBe(0);
    expect(state.lastTime).toBeNull();
  });

  it('returns stored values', async () => {
    localMock.get.mockResolvedValue({ consecutiveDismissals: 2, lastDismissalTime: 12345 });
    const { getDismissalState } = await import('../src/lib/storage');
    const state = await getDismissalState();
    expect(state.count).toBe(2);
    expect(state.lastTime).toBe(12345);
  });
});

describe('recordDismissal', () => {
  it('increments count within 10-minute window', async () => {
    const recentTime = Date.now() - 60_000; // 1 min ago — within window
    localMock.get.mockResolvedValue({ consecutiveDismissals: 1, lastDismissalTime: recentTime });
    const { recordDismissal } = await import('../src/lib/storage');
    const { autoSnooze } = await recordDismissal();
    expect(autoSnooze).toBe(false);
    const setCall = localMock.set.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(setCall['consecutiveDismissals']).toBe(2);
  });

  it('resets count when outside 10-minute window', async () => {
    const oldTime = Date.now() - 20 * 60_000; // 20 min ago — outside window
    localMock.get.mockResolvedValue({ consecutiveDismissals: 5, lastDismissalTime: oldTime });
    const { recordDismissal } = await import('../src/lib/storage');
    await recordDismissal();
    const setCall = localMock.set.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(setCall['consecutiveDismissals']).toBe(1);
  });

  it('triggers autoSnooze and resets count at 3 dismissals', async () => {
    const recentTime = Date.now() - 30_000;
    localMock.get.mockResolvedValue({ consecutiveDismissals: 2, lastDismissalTime: recentTime });
    const { recordDismissal } = await import('../src/lib/storage');
    const { autoSnooze } = await recordDismissal();
    expect(autoSnooze).toBe(true);
    // Second set call should reset the count
    const resetCall = localMock.set.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(resetCall['consecutiveDismissals']).toBe(0);
  });
});
