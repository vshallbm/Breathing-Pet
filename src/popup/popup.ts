import { getCopy } from '../copy/index';
import { getCharEmoji } from '../characters/emojis';
import type { Theme } from '../types';

interface StatusResponse {
  snoozedUntil: string | null;
  enabled: boolean;
  intervalMinutes: number | null;
  todaySessions: number;
  totalSessions: number;
  character: string;
  nextAlarmMs: number | null;
}

const RING_RADIUS = 29;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme === 'light' ? '' : theme;
}

async function getStatus(): Promise<StatusResponse> {
  return chrome.runtime.sendMessage({ type: 'GET_STATUS' }) as Promise<StatusResponse>;
}

function formatNextBreak(nextAlarmMs: number | null): string {
  if (!nextAlarmMs) return '';
  const diffMs = nextAlarmMs - Date.now();
  if (diffMs <= 0) return '';
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'in < 1 min';
  if (mins === 1) return 'in 1 min';
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
}

function pickGreeting(status: StatusResponse): string {
  if (!status.enabled) return 'on a break from breaks';
  if (status.snoozedUntil) return 'paused. all good.';
  const hour = new Date().getHours();
  if (status.todaySessions >= 5) return 'absolutely thriving';
  if (status.todaySessions >= 3) return "u're doing great";
  if (hour < 11) return 'soft start to the day';
  if (hour >= 22) return 'time to wind down';
  return "u're doing great";
}

function renderMascot(character: string): void {
  const art = document.getElementById('mascot-art')!;
  const emoji = document.getElementById('logo')!;
  if (character === 'cat') {
    art.hidden = false;
    emoji.hidden = true;
  } else {
    art.hidden = true;
    emoji.hidden = false;
    emoji.textContent = getCharEmoji(character);
  }
  // Mini mascot in footer chip mirrors the character.
  const mini = document.querySelector<HTMLElement>('.mini-mascot');
  if (mini) mini.textContent = getCharEmoji(character);
}

function renderStreakDots(todaySessions: number): void {
  const dots = document.querySelectorAll<HTMLElement>('#streak-dots .dot');
  const filled = Math.min(todaySessions, dots.length);
  dots.forEach((dot, idx) => {
    dot.classList.toggle('filled', idx < filled);
  });
}

function renderRing(nextAlarmMs: number | null, intervalMinutes: number | null): void {
  const ring = document.getElementById('ring-progress');
  if (!ring) return;
  ring.setAttribute('stroke-dasharray', String(RING_CIRCUMFERENCE));
  if (!nextAlarmMs || !intervalMinutes) {
    ring.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE));
    return;
  }
  const totalMs = intervalMinutes * 60_000;
  const remaining = Math.max(0, nextAlarmMs - Date.now());
  const progress = Math.min(1, Math.max(0, 1 - remaining / totalMs));
  ring.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE * (1 - progress)));
}

function renderNextBreak(status: StatusResponse, el: HTMLElement): void {
  if (status.snoozedUntil && new Date(status.snoozedUntil) > new Date()) {
    const time = new Date(status.snoozedUntil).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
    el.textContent = `back at ${time}`;
    return;
  }
  if (!status.enabled) {
    el.textContent = 'tap on when ready';
    return;
  }
  const t = formatNextBreak(status.nextAlarmMs);
  el.textContent = t ? `next breath ${t}` : 'next breath soon';
}

function setCapsuleState(
  status: StatusResponse,
  titleEl: HTMLElement,
  subEl: HTMLElement,
  capsule: HTMLElement | null,
  copy: ReturnType<typeof getCopy>,
): void {
  if (!status.enabled) {
    titleEl.textContent = 'off';
    subEl.textContent = 'tap to turn back on';
    if (capsule) capsule.dataset['state'] = 'off';
    return;
  }
  if (status.snoozedUntil && new Date(status.snoozedUntil) > new Date()) {
    const t = new Date(status.snoozedUntil).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
    titleEl.textContent = 'paused';
    subEl.textContent = `back at ${t}`;
    if (capsule) capsule.dataset['state'] = 'paused';
    return;
  }
  titleEl.textContent = 'on';
  subEl.textContent = status.todaySessions > 0
    ? copy.popup.sessionsToday(status.todaySessions)
    : 'tap to chill it';
  if (capsule) capsule.dataset['state'] = 'on';
}

function localizeChips(locale: string, copy: ReturnType<typeof getCopy>): void {
  // English keeps the hardcoded vibe sublabels in HTML.
  if (locale.startsWith('en')) return;
  document.querySelectorAll<HTMLButtonElement>('[data-snooze]').forEach(btn => {
    const titleEl = btn.querySelector<HTMLElement>('.chip-title');
    const subEl = btn.querySelector<HTMLElement>('.chip-sub');
    if (!titleEl || !subEl) return;
    const val = btn.dataset['snooze']!;
    if (val === '30')      { titleEl.textContent = '30m';   subEl.textContent = copy.popup.pause30; }
    else if (val === '120'){ titleEl.textContent = '2h';    subEl.textContent = copy.popup.pause2h; }
    else if (val === 'today'){ titleEl.textContent = 'today'; subEl.textContent = copy.popup.pauseToday; }
  });
}

async function init() {
  const stored = await chrome.storage.sync.get(['theme', 'locale']).catch(() => ({}));
  const theme = ((stored as Record<string, unknown>)['theme'] as Theme | undefined) ?? 'light';
  const locale = ((stored as Record<string, unknown>)['locale'] as string | undefined) ?? 'en-US';
  applyTheme(theme);
  document.documentElement.lang = locale;
  const copy = getCopy(locale);
  localizeChips(locale, copy);

  const status = await getStatus();

  renderMascot(status.character);
  renderStreakDots(status.todaySessions);
  renderRing(status.nextAlarmMs, status.intervalMinutes);

  // Greeting shifts subtly by streak / time of day.
  const greetingEl = document.getElementById('greeting-title')!;
  greetingEl.textContent = pickGreeting(status);

  // Streak text shows only when over 5 sessions (dots cap at 5).
  const streakBadge = document.getElementById('streak-badge')!;
  streakBadge.textContent = status.todaySessions > 5 ? `+${status.todaySessions - 5}` : '';

  // Next-break / status sub
  const nextBreakEl = document.getElementById('next-break')!;
  renderNextBreak(status, nextBreakEl);

  const toggle = document.getElementById('enabled-toggle') as HTMLInputElement;
  const toggleLabel = document.getElementById('toggle-label')!;
  const statusText = document.getElementById('status-text')!;
  const capsule = document.querySelector<HTMLElement>('.capsule');

  toggle.checked = status.enabled;
  setCapsuleState(status, toggleLabel, statusText, capsule, copy);

  toggle.addEventListener('change', async (ev) => {
    ev.stopPropagation();
    if (!toggle.checked) {
      const confirmed = window.confirm(copy.popup.confirmOff);
      if (!confirmed) { toggle.checked = true; return; }
    }
    await chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED', enabled: toggle.checked });
    const updated = await getStatus();
    setCapsuleState(updated, toggleLabel, statusText, capsule, copy);
    renderRing(updated.nextAlarmMs, updated.intervalMinutes);
    renderNextBreak(updated, nextBreakEl);
    greetingEl.textContent = pickGreeting(updated);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-snooze]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.dataset['snooze']!;
      let minutes: number;
      if (val === 'today') {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        minutes = Math.round((midnight.getTime() - now.getTime()) / 60_000);
      } else {
        minutes = parseInt(val, 10);
      }
      await chrome.runtime.sendMessage({ type: 'SNOOZE', minutes });
      const updated = await getStatus();
      setCapsuleState(updated, toggleLabel, statusText, capsule, copy);
      renderRing(updated.nextAlarmMs, updated.intervalMinutes);
      renderNextBreak(updated, nextBreakEl);
      greetingEl.textContent = pickGreeting(updated);
    });
  });

  const breatheBtn = document.getElementById('breathe-now-btn');
  let statusResetTimer: ReturnType<typeof setTimeout> | null = null;
  breatheBtn?.addEventListener('click', async () => {
    breatheBtn.setAttribute('disabled', '');
    let ok = false;
    try {
      const res = await chrome.runtime.sendMessage({ type: 'TRIGGER_BREAK' }) as { ok: boolean } | undefined;
      ok = res?.ok === true;
    } catch {
      // SW inactive or port closed mid-flight
    }
    if (ok) {
      window.close();
    } else {
      breatheBtn.removeAttribute('disabled');
      const originalText = statusText.textContent;
      if (statusResetTimer !== null) clearTimeout(statusResetTimer);
      statusText.textContent = 'open a webpage first 🐱';
      statusResetTimer = setTimeout(() => {
        statusText.textContent = originalText;
        statusResetTimer = null;
      }, 2500);
    }
  });

  document.getElementById('character-switcher')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('options-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

init().catch(console.error);
