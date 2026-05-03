// Body-double / Focus mode — Premium Phase 5 feature.
// A small corner mascot that stays visible during Pomodoro work blocks.
// Never active simultaneously with the full-screen overlay on the same page.

import { getMascotSvg } from './mascots';

let buddyEl: HTMLElement | null = null;
let pomodoroTimer: ReturnType<typeof setInterval> | null = null;
let workSecondsLeft = 0;

const WORK_SECONDS  = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function showBuddy(): void {
  if (buddyEl) return;

  chrome.storage.sync.get({ character: 'cat' }).then((stored) => {
    const svg = getMascotSvg((stored as { character: string }).character);

    const host = document.createElement('div');
    host.id = 'breath-break-buddy';
    host.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:2147483646',
      'display:flex', 'flex-direction:column', 'align-items:center', 'gap:4px',
      'font-family:system-ui,sans-serif', 'cursor:default', 'user-select:none',
    ].join(';');

    const mascot = document.createElement('div');
    mascot.style.cssText = 'width:40px;height:40px;transition:transform 150ms;';
    mascot.innerHTML = svg;
    mascot.querySelector('svg')?.setAttribute('width', '40');
    mascot.querySelector('svg')?.setAttribute('height', '40');
    mascot.addEventListener('mouseenter', () => { mascot.style.transform = 'scale(1.15)'; });
    mascot.addEventListener('mouseleave', () => { mascot.style.transform = ''; });

    const timerEl = document.createElement('div');
    timerEl.style.cssText = 'font-size:10px;color:#6c63ff;font-weight:700;background:rgba(255,255,255,0.9);border-radius:4px;padding:1px 5px;';
    timerEl.textContent = '25:00';

    host.appendChild(mascot);
    host.appendChild(timerEl);
    document.body.appendChild(host);
    buddyEl = host;

    startPomodoroClock(timerEl);
  }).catch(() => undefined);
}

export function hideBuddy(): void {
  if (pomodoroTimer) { clearInterval(pomodoroTimer); pomodoroTimer = null; }
  buddyEl?.remove();
  buddyEl = null;
}

function startPomodoroClock(timerEl: HTMLElement): void {
  workSecondsLeft = WORK_SECONDS;
  let isBreak = false;

  pomodoroTimer = setInterval(() => {
    workSecondsLeft--;
    if (workSecondsLeft <= 0) {
      if (!isBreak) {
        // Work block done → trigger a breath break directly on this page's overlay element
        // (routing through the SW active-tab lookup fails when this tab is not the focused window)
        let root = document.getElementById('breath-break-root');
        if (!root) {
          root = document.createElement('div');
          root.id = 'breath-break-root';
          document.body.appendChild(root);
        }
        if (!root.querySelector('breath-break-overlay')) {
          root.appendChild(document.createElement('breath-break-overlay'));
        }
        (root.querySelector('breath-break-overlay') as unknown as { show: () => void } | null)?.show();
        isBreak = true;
        workSecondsLeft = BREAK_SECONDS;
        timerEl.style.color = '#4caf50';
      } else {
        isBreak = false;
        workSecondsLeft = WORK_SECONDS;
        timerEl.style.color = '#6c63ff';
      }
    }
    const m = Math.floor(workSecondsLeft / 60);
    const s = workSecondsLeft % 60;
    timerEl.textContent = `${isBreak ? '🌿' : '🍅'} ${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}
