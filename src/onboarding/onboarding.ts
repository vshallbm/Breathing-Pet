import { BreathingEngine } from '../content/breathing-engine';
import { Pacer } from '../content/pacer';
import { getPattern } from '../patterns/index';
import { saveSettings } from '../lib/storage';
import { getMascotSvg } from '../content/mascots';
import { en } from '../copy/en';
import type { AudioMode, RampPreset } from '../types';

const DEMO_DURATION_S = 30;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screens = {
  demo:  document.getElementById('screen-demo')!,
  pitch: document.getElementById('screen-pitch')!,
  quiz:  document.getElementById('screen-quiz')!,
  done:  document.getElementById('screen-done')!,
};

function showScreen(name: keyof typeof screens) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Demo session ──────────────────────────────────────────────────────────────
function startDemo() {
  const mascotEl = document.getElementById('demo-mascot')!;
  mascotEl.innerHTML = getMascotSvg('cat');

  const auraEl = document.querySelector<SVGCircleElement>('.demo-aura')!;
  const phaseEl = document.getElementById('demo-phase')!;
  const fillEl = document.getElementById('demo-progress-fill')!;

  // Create a temporary div to host the counter (pacer needs an HTMLElement)
  const counterEl = document.createElement('div');
  counterEl.style.display = 'none';
  document.body.appendChild(counterEl);

  const pattern = getPattern('box_4_4_4_4');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pacer = new Pacer(reducedMotion);
  pacer.attach(auraEl, counterEl);

  const engine = new BreathingEngine(pattern, DEMO_DURATION_S, {
    onPhaseChange: (label) => {
      const phase = pattern.phases.find(p => p.label === label);
      pacer.onPhaseChange(label, phase?.seconds ?? 4);
      phaseEl.textContent = en.phase[label];
    },
    onTick: (phaseProgress, totalProgress) => {
      pacer.onTick(phaseProgress, totalProgress);
      fillEl.style.width = `${Math.round(totalProgress * 100)}%`;
    },
    onComplete: () => {
      counterEl.remove();
      phaseEl.textContent = '✨ Nice one';
      setTimeout(() => showScreen('pitch'), 800);
    },
    onAborted: () => {
      counterEl.remove();
      showScreen('pitch');
    },
  });

  engine.start();

  document.getElementById('skip-demo-btn')!.addEventListener('click', () => {
    engine.abort();
  });
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
const steps = ['sites', 'freq', 'audio'] as const;
let currentStep = 0;

function updateQuizUI() {
  document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${steps[currentStep]}`)!.classList.add('active');
  document.getElementById('step-counter')!.textContent = `Question ${currentStep + 1} of ${steps.length}`;
  const titles: Record<string, string> = {
    sites: 'Where do you lose the most time?',
    freq:  'How often should I check in?',
    audio: 'What sound works for you?',
  };
  document.getElementById('quiz-title')!.textContent = titles[steps[currentStep]];
  const backBtn = document.getElementById('quiz-back-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('quiz-next-btn') as HTMLButtonElement;
  backBtn.style.display = currentStep > 0 ? '' : 'none';
  nextBtn.textContent = currentStep === steps.length - 1 ? 'Finish →' : 'Next →';
}

// Highlight selected options
document.querySelectorAll('.quiz-opt').forEach(label => {
  const input = label.querySelector('input')!;
  input.addEventListener('change', () => {
    if (input.type === 'radio') {
      const group = label.closest('.quiz-options');
      group?.querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('selected'));
    }
    label.classList.toggle('selected', (input as HTMLInputElement).checked);
  });
});

document.getElementById('quiz-next-btn')!.addEventListener('click', async () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateQuizUI();
  } else {
    await saveQuizSettings();
    showScreen('done');
  }
});

document.getElementById('quiz-back-btn')!.addEventListener('click', () => {
  if (currentStep > 0) { currentStep--; updateQuizUI(); }
});

async function saveQuizSettings() {
  const siteCheckboxes = document.querySelectorAll<HTMLInputElement>('#step-sites input[type="checkbox"]:checked');
  const sites = Array.from(siteCheckboxes)
    .flatMap(cb => cb.value.split(',').map(s => s.trim()))
    .filter(Boolean);

  const ramp = (document.querySelector<HTMLInputElement>('input[name="ramp"]:checked')?.value ?? 'adaptive') as RampPreset;
  const audio = (document.querySelector<HTMLInputElement>('input[name="audio"]:checked')?.value ?? 'silent') as AudioMode;

  await saveSettings({
    ...(sites.length ? { targetSites: sites } : {}),
    rampPreset: ramp,
    audioMode: audio,
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────
document.getElementById('start-quiz-btn')!.addEventListener('click', () => {
  currentStep = 0;
  updateQuizUI();
  showScreen('quiz');
});

document.getElementById('skip-quiz-btn')!.addEventListener('click', () => showScreen('done'));

document.getElementById('open-settings-btn')!.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

document.getElementById('close-btn')!.addEventListener('click', () => window.close());

// ── Boot ──────────────────────────────────────────────────────────────────────
startDemo();
