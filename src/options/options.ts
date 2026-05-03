import { getSettings, saveSettings } from '../lib/storage';
import { showPaywallStub } from '../premium/paywall';
import { validateKeyFormat } from '../premium/subscription';
import { CHARACTER_REGISTRY } from '../characters/registry';
import { getCharEmoji } from '../characters/emojis';
import { getCrisisResource } from '../lib/crisis';
import { getCopy } from '../copy/index';
import type { AudioMode, MoodEmoji, ReducedMotion, RampPreset, Theme } from '../types';

const PAYWALLED_MODES: AudioMode[] = ['voice_savage', 'voice_custom'];

// Mood emoji → bar colour
const MOOD_COLORS: Record<MoodEmoji, string> = {
  '😌': '#6abf69', '🙂': '#7ec8e3', '😐': '#f5c842', '😣': '#e07b5a',
};

function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme === 'light' ? '' : theme;
}

async function exportData(): Promise<void> {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get(null),
  ]);
  const payload = { exportedAt: new Date().toISOString(), sync, local };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `breath-break-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function clearAllData(): Promise<void> {
  const confirmed = window.confirm('This will erase all settings, streak, and mood history. Are you sure?');
  if (!confirmed) return;
  await Promise.all([chrome.storage.sync.clear(), chrome.storage.local.clear()]);
  window.location.reload();
}

function renderMoodChart(
  history: Array<{ date: string; emoji: MoodEmoji }>,
  chartEl: HTMLElement,
  summaryEl: HTMLElement,
): void {
  chartEl.innerHTML = '';
  if (!history.length) {
    summaryEl.textContent = 'No sessions yet. Complete a session to see your mood history.';
    return;
  }

  // Build per-day map for last 30 days
  const days: Map<string, MoodEmoji[]> = new Map();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    days.set(d.toISOString().slice(0, 10), []);
  }
  for (const { date, emoji } of history) {
    const key = date.slice(0, 10);
    if (days.has(key)) days.get(key)!.push(emoji);
  }

  // Render 30-day bar chart (one bar per day)
  for (const [date, moods] of days) {
    const bar = document.createElement('div');
    bar.className = 'mood-bar';
    bar.title = date;
    if (moods.length) {
      // Use most common mood for colour
      const counts: Partial<Record<MoodEmoji, number>> = {};
      for (const e of moods) counts[e] = (counts[e] ?? 0) + 1;
      const top = (Object.entries(counts) as [MoodEmoji, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
      bar.style.background = MOOD_COLORS[top];
      bar.style.height = `${Math.min(32, 8 + moods.length * 6)}px`;
      bar.textContent = moods.length > 1 ? String(moods.length) : '';
    } else {
      bar.style.background = 'var(--border, #e5e5e5)';
      bar.style.height = '4px';
    }
    chartEl.appendChild(bar);
  }

  // Summary line
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const weekMoods = history.filter(m => m.date.slice(0, 10) >= weekStr);
  const totalSessions = history.length;
  summaryEl.textContent = `${weekMoods.length} session${weekMoods.length !== 1 ? 's' : ''} this week · ${totalSessions} total`;
}

async function init() {
  const settings = await getSettings();
  const copy = getCopy(settings.locale);
  const sites = [...settings.targetSites];
  let selectedCharacter = settings.character;

  applyTheme(settings.theme);

  // Country-aware crisis link
  const crisis = getCrisisResource(settings.locale);
  const crisisEl = document.querySelector<HTMLAnchorElement>('.crisis-link');
  if (crisisEl) { crisisEl.href = crisis.url; crisisEl.textContent = crisis.label; }

  const rampEl          = document.getElementById('ramp-preset') as HTMLSelectElement;
  const patternEl       = document.getElementById('pattern-select') as HTMLSelectElement;
  const themeEl         = document.getElementById('theme-select') as HTMLSelectElement;
  const audioModeEl     = document.getElementById('audio-mode-select') as HTMLSelectElement;
  const musicTrackEl      = document.getElementById('music-track-select') as HTMLSelectElement;
  const musicTrackRow     = document.getElementById('music-track-row') as HTMLElement;
  const customVoiceRow    = document.getElementById('custom-voice-row') as HTMLElement;
  const customIntroUrlEl  = document.getElementById('custom-intro-url') as HTMLInputElement;
  const customOutroUrlEl  = document.getElementById('custom-outro-url') as HTMLInputElement;
  const reducedMotionEl = document.getElementById('reduced-motion-select') as HTMLSelectElement;
  const everywhereToggle = document.getElementById('everywhere-toggle') as HTMLInputElement;
  const sitesSection    = document.getElementById('sites-section') as HTMLElement;
  const buddyToggle     = document.getElementById('buddy-toggle') as HTMLInputElement;
  const localeEl        = document.getElementById('locale-select') as HTMLSelectElement;
  const charGrid        = document.getElementById('character-grid') as HTMLElement;
  const siteList        = document.getElementById('site-list') as HTMLUListElement;
  const newSiteInput    = document.getElementById('new-site') as HTMLInputElement;
  const addSiteBtn      = document.getElementById('add-site-btn') as HTMLButtonElement;
  const saveBtn         = document.getElementById('save-btn') as HTMLButtonElement;
  const savedMsg        = document.getElementById('saved-msg')!;
  const exportBtn       = document.getElementById('export-btn') as HTMLButtonElement;
  const clearBtn        = document.getElementById('clear-btn') as HTMLButtonElement;
  const mascotNameEl    = document.getElementById('mascot-name') as HTMLInputElement;

  // Premium section
  const premiumStatus  = document.getElementById('premium-status')!;
  const premiumHint    = document.getElementById('premium-hint')!;
  const licenseRow     = document.getElementById('license-row')!;
  const licenseKeyEl   = document.getElementById('license-key') as HTMLInputElement;
  const applyLicenseBtn = document.getElementById('apply-license-btn') as HTMLButtonElement;
  const licenseMsg     = document.getElementById('license-msg')!;
  const buyBtn         = document.getElementById('buy-btn') as HTMLButtonElement;

  // Mood chart
  const moodChartEl   = document.getElementById('mood-chart') as HTMLElement;
  const moodSummaryEl = document.getElementById('mood-summary')!;

  // ── Initial values ──────────────────────────────────────────────────────────
  rampEl.value          = settings.rampPreset;
  patternEl.value       = settings.pattern;
  themeEl.value         = settings.theme;
  audioModeEl.value     = settings.audioMode;
  reducedMotionEl.value = settings.reducedMotion;
  localeEl.value        = settings.locale;
  if (settings.musicTrack) musicTrackEl.value = settings.musicTrack;
  musicTrackRow.classList.toggle('hidden', settings.audioMode !== 'music');
  customVoiceRow.classList.toggle('hidden', settings.audioMode !== 'voice_custom');
  if (settings.customLines?.intro) customIntroUrlEl.value = settings.customLines.intro;
  if (settings.customLines?.outro) customOutroUrlEl.value = settings.customLines.outro;
  everywhereToggle.checked = settings.everywhereMode;
  sitesSection.classList.toggle('hidden', settings.everywhereMode);
  buddyToggle.checked = settings.buddyMode;
  mascotNameEl.value = settings.customMascotName ?? '';

  // Premium status display
  if (settings.lifetimeUnlocked || settings.isPremium) {
    const label = settings.tier === 'premium' ? '✦ Premium' : '✦ Plus';
    premiumStatus.innerHTML = `<span class="premium-badge">${label}</span> All features unlocked.`;
    premiumHint.style.display = 'none';
    licenseRow.style.display = 'none';
    buyBtn.style.display = 'none';
  }

  // Mood chart
  const localData = await chrome.storage.local.get('moodHistory');
  const moodHistory = (localData['moodHistory'] as Array<{ date: string; emoji: MoodEmoji }>) ?? [];
  renderMoodChart(moodHistory, moodChartEl, moodSummaryEl);

  // ── Event listeners ─────────────────────────────────────────────────────────
  everywhereToggle.addEventListener('change', () => {
    sitesSection.classList.toggle('hidden', everywhereToggle.checked);
  });
  themeEl.addEventListener('change', () => applyTheme(themeEl.value as Theme));
  audioModeEl.addEventListener('change', () => {
    const mode = audioModeEl.value as AudioMode;
    if (PAYWALLED_MODES.includes(mode) && !settings.isPremium && !settings.lifetimeUnlocked) {
      showPaywallStub(audioModeEl.options[audioModeEl.selectedIndex].text, copy);
      audioModeEl.value = settings.audioMode;
      return;
    }
    musicTrackRow.classList.toggle('hidden', mode !== 'music');
    customVoiceRow.classList.toggle('hidden', mode !== 'voice_custom');
  });

  exportBtn.addEventListener('click', () => exportData().catch(console.error));
  clearBtn.addEventListener('click', () => clearAllData().catch(console.error));

  // License key — rate-limited to 5 attempts per session to prevent brute-force
  let licenseAttempts = 0;
  const MAX_LICENSE_ATTEMPTS = 5;

  applyLicenseBtn.addEventListener('click', async () => {
    if (licenseAttempts >= MAX_LICENSE_ATTEMPTS) {
      licenseMsg.textContent = 'Too many attempts. Please reload the page.';
      licenseMsg.style.color = '#e07b5a';
      applyLicenseBtn.disabled = true;
      return;
    }
    const key = licenseKeyEl.value.trim();
    if (!validateKeyFormat(key)) {
      licenseMsg.textContent = 'Key format: BB-XXXX-XXXX-XXXX';
      licenseMsg.style.color = '#e07b5a';
      return;
    }
    licenseAttempts++;
    applyLicenseBtn.disabled = true;
    applyLicenseBtn.textContent = '…';
    const result = await chrome.runtime.sendMessage({ type: 'APPLY_LICENSE', key }) as
      { ok: boolean; tier: string; error?: string };
    applyLicenseBtn.disabled = licenseAttempts >= MAX_LICENSE_ATTEMPTS;
    applyLicenseBtn.textContent = 'Apply';
    if (result.ok) {
      licenseAttempts = 0;
      licenseMsg.textContent = `✓ ${result.tier === 'premium' ? 'Premium' : 'Plus'} unlocked!`;
      licenseMsg.style.color = '#6abf69';
      window.location.reload();
    } else {
      licenseMsg.textContent = result.error ?? 'Invalid key.';
      licenseMsg.style.color = '#e07b5a';
    }
  });

  buyBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_CHECKOUT' }).catch(() => undefined);
  });

  // Character grid
  function renderCharGrid() {
    charGrid.innerHTML = '';
    for (const def of CHARACTER_REGISTRY) {
      const unlocked = settings.unlockedCharacters.includes(def.id);
      const card = document.createElement('div');
      card.className = 'char-card' +
        (def.id === selectedCharacter ? ' char-selected' : '') +
        (!unlocked ? ' char-locked' : '');
      card.innerHTML = `
        <span class="char-emoji">${getCharEmoji(def.id)}</span>
        <span>${def.label}</span>
        <span class="char-tier">${def.tier}</span>
        ${!unlocked ? '<div class="char-lock">🔒</div>' : ''}
      `;
      if (unlocked) {
        card.addEventListener('click', () => { selectedCharacter = def.id; renderCharGrid(); });
      } else {
        card.addEventListener('click', () => showPaywallStub(def.label, copy));
      }
      charGrid.appendChild(card);
    }
  }
  renderCharGrid();

  function renderSites() {
    siteList.innerHTML = '';
    sites.forEach((site, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${site}</span><button data-i="${i}">Remove</button>`;
      li.querySelector('button')?.addEventListener('click', () => { sites.splice(i, 1); renderSites(); });
      siteList.appendChild(li);
    });
  }
  renderSites();

  addSiteBtn.addEventListener('click', () => {
    const val = newSiteInput.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!val || sites.includes(val)) return;
    if (!settings.isPremium && !settings.lifetimeUnlocked && sites.length >= 3) {
      showPaywallStub('Unlimited target sites', copy);
      return;
    }
    sites.push(val);
    renderSites();
    newSiteInput.value = '';
  });

  saveBtn.addEventListener('click', async () => {
    const mode = audioModeEl.value as AudioMode;
    const newBuddyMode = buddyToggle.checked;
    await saveSettings({
      rampPreset:       rampEl.value as RampPreset,
      pattern:          patternEl.value,
      theme:            themeEl.value as Theme,
      reducedMotion:    reducedMotionEl.value as ReducedMotion,
      everywhereMode:   everywhereToggle.checked,
      locale:           localeEl.value,
      targetSites:      sites,
      audioMode:        mode,
      musicTrack:       mode === 'music' ? musicTrackEl.value : null,
      character:        selectedCharacter,
      buddyMode:        newBuddyMode,
      customMascotName: mascotNameEl.value.trim() || null,
      customLines: {
        intro: customIntroUrlEl.value.trim() || null,
        outro: customOutroUrlEl.value.trim() || null,
      },
    });
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: { buddyMode: newBuddyMode } }).catch(() => undefined);
    savedMsg.textContent = 'Saved!';
    setTimeout(() => { savedMsg.textContent = ''; }, 2000);
  });
}

init().catch(console.error);
