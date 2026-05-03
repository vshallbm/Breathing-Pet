import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const STATUS_RESPONSE = {
  snoozedUntil: null,
  enabled: true,
  intervalMinutes: 25,
  todaySessions: 0,
  totalSessions: 0,
  character: 'cat',
  nextAlarmMs: null,
};

const MINIMAL_POPUP_HTML = `
<div class="card">
  <div class="mascot-wrap">
    <svg class="ring" viewBox="0 0 64 64">
      <circle class="ring-track" cx="32" cy="32" r="29"/>
      <circle class="ring-progress" cx="32" cy="32" r="29" id="ring-progress"/>
    </svg>
    <div class="mascot-art" id="mascot-art"></div>
    <span class="mascot-emoji" id="logo" hidden></span>
  </div>
  <div class="greeting">
    <h1 id="greeting-title"></h1>
    <p id="next-break"></p>
  </div>
  <div class="vibes">
    <div id="streak-dots">
      <span class="dot" data-i="0"></span>
      <span class="dot" data-i="1"></span>
      <span class="dot" data-i="2"></span>
      <span class="dot" data-i="3"></span>
      <span class="dot" data-i="4"></span>
    </div>
    <span id="streak-badge"></span>
  </div>
  <label class="capsule" data-state="on">
    <span class="capsule-text">
      <span id="toggle-label">on</span>
      <span id="status-text">tap to chill it</span>
    </span>
    <span class="switch">
      <input type="checkbox" id="enabled-toggle" checked>
      <span class="slider"></span>
    </span>
  </label>
  <button id="breathe-now-btn" type="button">breathe now 🐱</button>
  <div class="chips">
    <button class="chip" data-snooze="30" type="button"><span class="chip-title">30m</span><span class="chip-sub">lol brb</span></button>
    <button class="chip" data-snooze="120" type="button"><span class="chip-title">2h</span><span class="chip-sub">deep work</span></button>
    <button class="chip" data-snooze="today" type="button"><span class="chip-title">today</span><span class="chip-sub">not today</span></button>
  </div>
  <div class="footer">
    <button id="character-switcher" type="button"><span class="mini-mascot">🐱</span><span>switch vibe</span></button>
    <a id="options-link" href="#">•••</a>
  </div>
</div>
`;

function makeSendMessage(triggerResponse: unknown) {
  return vi.fn().mockImplementation((msg: { type: string }) => {
    if (msg.type === 'GET_STATUS') return Promise.resolve(STATUS_RESPONSE);
    if (msg.type === 'TRIGGER_BREAK') return Promise.resolve(triggerResponse);
    return Promise.resolve({ ok: true });
  });
}

async function setupPopup(triggerResponse: unknown) {
  document.body.innerHTML = MINIMAL_POPUP_HTML;

  vi.stubGlobal('chrome', {
    storage: {
      sync: { get: vi.fn().mockResolvedValue({ theme: 'light', locale: 'en-US' }) },
    },
    runtime: {
      sendMessage: makeSendMessage(triggerResponse),
      openOptionsPage: vi.fn(),
    },
  });

  // Import fresh module each test by resetting the module registry
  const { default: _popup } = await import('../src/popup/popup?v=' + Date.now());
  // Give init() time to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe('breathe-now button', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('calls window.close() when response is ok:true', async () => {
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    await setupPopup({ ok: true });

    const btn = document.getElementById('breathe-now-btn')!;
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('shows inline hint when response is ok:false', async () => {
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
    await setupPopup({ ok: false });

    const btn = document.getElementById('breathe-now-btn')!;
    const statusText = document.getElementById('status-text')!;

    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(statusText.textContent).toBe('open a webpage first 🐱');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('shows inline hint when response is undefined (SW inactive)', async () => {
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
    await setupPopup(undefined);

    const btn = document.getElementById('breathe-now-btn')!;
    const statusText = document.getElementById('status-text')!;

    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(statusText.textContent).toBe('open a webpage first 🐱');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('shows inline hint when sendMessage throws (port closed)', async () => {
    vi.spyOn(window, 'close').mockImplementation(() => undefined);

    document.body.innerHTML = MINIMAL_POPUP_HTML;
    vi.stubGlobal('chrome', {
      storage: {
        sync: { get: vi.fn().mockResolvedValue({ theme: 'light', locale: 'en-US' }) },
      },
      runtime: {
        sendMessage: vi.fn().mockImplementation((msg: { type: string }) => {
          if (msg.type === 'GET_STATUS') return Promise.resolve(STATUS_RESPONSE);
          return Promise.reject(new Error('The message port closed before a response was received.'));
        }),
        openOptionsPage: vi.fn(),
      },
    });
    await import('../src/popup/popup?v=' + Date.now());
    await new Promise((resolve) => setTimeout(resolve, 50));

    const btn = document.getElementById('breathe-now-btn')!;
    const statusText = document.getElementById('status-text')!;

    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(statusText.textContent).toBe('open a webpage first 🐱');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('restores status text after 2500ms', async () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'close').mockImplementation(() => undefined);

    document.body.innerHTML = MINIMAL_POPUP_HTML;
    const statusText = document.getElementById('status-text')!;
    statusText.textContent = 'tap to chill it';

    vi.stubGlobal('chrome', {
      storage: {
        sync: { get: vi.fn().mockResolvedValue({ theme: 'light', locale: 'en-US' }) },
      },
      runtime: {
        sendMessage: makeSendMessage({ ok: false }),
        openOptionsPage: vi.fn(),
      },
    });
    await import('../src/popup/popup?v=' + Date.now());
    // Flush microtask queue (multiple hops) to let init() complete
    for (let i = 0; i < 20; i++) await Promise.resolve();

    const btn = document.getElementById('breathe-now-btn')!;
    btn.click();
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(statusText.textContent).toBe('open a webpage first 🐱');

    vi.advanceTimersByTime(2500);
    expect(statusText.textContent).toBe('tap to chill it');

    vi.useRealTimers();
  });
});
