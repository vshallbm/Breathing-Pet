import { BreathingEngine } from './breathing-engine';
import { Pacer } from './pacer';
import { getPattern } from '../patterns/index';
import { getCopy } from '../copy/index';
import { prefersReducedMotion } from '../lib/a11y';
import { AudioPlayer } from '../audio/player';
import { getChimeUrl, getMusicUrl, getVoiceClips, isVoiceMode } from '../audio/catalog';
import type { PhaseLabel } from './breathing-engine';
import type { AudioMode, MoodEmoji } from '../types';

export type SessionState = 'pre' | 'running' | 'post' | 'aborted';

export interface SessionCallbacks {
  onStateChange?: (state: SessionState) => void;
  onPhaseLabel?: (label: string) => void;
  onTotalProgress?: (progress: number) => void;
  onComplete?: () => void;
  onAborted?: () => void;
  onMoodRecorded?: (emoji: MoodEmoji) => void;
}

interface AudioSettings {
  audioMode: AudioMode;
  musicTrack: string | null;
  sleepModeAfter22: boolean;
  customLines: { intro: string | null; outro: string | null };
}

function isSleepTime(): boolean {
  return new Date().getHours() >= 22;
}

export class SessionController {
  private engine: BreathingEngine | null = null;
  private pacer: Pacer | null = null;
  private player: AudioPlayer | null = null;
  private state: SessionState = 'pre';
  private readonly callbacks: SessionCallbacks;
  readonly sleepMode: boolean;
  reducedMotion: boolean;

  constructor(callbacks: SessionCallbacks = {}) {
    this.callbacks = callbacks;
    this.sleepMode = isSleepTime();
    this.reducedMotion = prefersReducedMotion(); // may be overridden in start() after settings load
  }

  async start(
    auraEl: SVGCircleElement,
    counterEl: HTMLElement,
    shadowRoot: ShadowRoot,
  ): Promise<void> {
    const settings = await this.loadSettings();
    const pattern = getPattern(settings.pattern);
    const audio = settings.audio;
    const copy = getCopy(settings.locale);

    // Override OS-level reduced motion with user setting
    if (settings.reducedMotion === 'on') this.reducedMotion = true;
    else if (settings.reducedMotion === 'off') this.reducedMotion = false;

    // Set up audio player
    this.player = new AudioPlayer();
    this.player.attach(shadowRoot);

    // Duck external tabs and play intro voice (if applicable) before engine starts
    const needsAudio = audio.audioMode !== 'silent';
    if (needsAudio && !this.sleepMode) {
      await this.duckBackground();
      if (audio.audioMode === 'voice_custom') {
        if (audio.customLines.intro) await this.player.playVoice(audio.customLines.intro);
      } else if (isVoiceMode(audio.audioMode)) {
        const clips = getVoiceClips(audio.audioMode);
        if (clips) await this.player.playVoice(clips.intro);
      } else if (audio.audioMode === 'music' && audio.musicTrack) {
        const url = getMusicUrl(audio.musicTrack);
        if (url) await this.player.playMusic(url);
      }
    }

    // Set up pacer
    this.pacer = new Pacer(this.reducedMotion);
    this.pacer.attach(auraEl, counterEl);

    // Build engine
    this.engine = new BreathingEngine(pattern, settings.sessionDurationSeconds, {
      onPhaseChange: (label: PhaseLabel) => {
        const phase = pattern.phases.find((p) => p.label === label);
        this.pacer!.onPhaseChange(label, phase?.seconds ?? 4);
        this.callbacks.onPhaseLabel?.(copy.phase[label]);
      },
      onTick: (phaseProgress, totalProgress) => {
        this.pacer!.onTick(phaseProgress, totalProgress);
        this.callbacks.onTotalProgress?.(totalProgress);
      },
      onComplete: () => {
        this.handleComplete(audio);
      },
      onAborted: () => {
        this.handleAbort(audio);
      },
    });

    this.setState('running');
    this.engine.start();
  }

  abort(): void {
    this.engine?.abort();
  }

  recordMood(emoji: MoodEmoji): void {
    this.callbacks.onMoodRecorded?.(emoji);
    this.saveMood(emoji);
  }

  private async handleComplete(audio: AudioSettings): Promise<void> {
    this.setState('post');

    if (!this.sleepMode && this.player) {
      if (audio.audioMode === 'music') {
        await this.player.fadeOut(300);
      } else if (audio.audioMode === 'voice_custom') {
        await this.player.fadeOut(100);
        if (audio.customLines.outro) await this.player.playVoice(audio.customLines.outro);
      } else if (isVoiceMode(audio.audioMode)) {
        await this.player.fadeOut(100);
        const clips = getVoiceClips(audio.audioMode);
        if (clips) await this.player.playVoice(clips.outro);
      } else if (audio.audioMode === 'chime') {
        await this.player.playChime(getChimeUrl());
      }
    }

    this.restoreBackground();
    this.callbacks.onComplete?.();
    this.reportComplete();
  }

  private async handleAbort(audio: AudioSettings): Promise<void> {
    this.setState('aborted');
    if (this.player) {
      await this.player.fadeOut(150);
      this.player.stop();
    }
    if (audio.audioMode !== 'silent') this.restoreBackground();
    this.callbacks.onAborted?.();
    this.reportDismissed();
  }

  private setState(state: SessionState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  get currentState(): SessionState {
    return this.state;
  }

  private async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'pattern',
        'sessionDurationSeconds',
        'reducedMotion',
        'audioMode',
        'musicTrack',
        'sleepModeAfter22',
        'locale',
        'customLines',
      ]);
      const customLines = (result['customLines'] as { intro: string | null; outro: string | null } | null)
        ?? { intro: null, outro: null };
      return {
        pattern: (result['pattern'] as string) ?? 'box_4_4_4_4',
        sessionDurationSeconds: (result['sessionDurationSeconds'] as number) ?? 60,
        reducedMotion: (result['reducedMotion'] as 'auto' | 'on' | 'off') ?? 'auto',
        locale: (result['locale'] as string) ?? 'en-US',
        audio: {
          audioMode: (result['audioMode'] as AudioMode) ?? 'silent',
          musicTrack: (result['musicTrack'] as string | null) ?? null,
          sleepModeAfter22: (result['sleepModeAfter22'] as boolean) ?? true,
          customLines,
        } satisfies AudioSettings,
      };
    } catch {
      return {
        pattern: 'box_4_4_4_4',
        sessionDurationSeconds: 60,
        reducedMotion: 'auto' as const,
        locale: 'en-US',
        audio: { audioMode: 'silent' as AudioMode, musicTrack: null, sleepModeAfter22: true, customLines: { intro: null, outro: null } },
      };
    }
  }

  private reportComplete(): void {
    chrome.runtime.sendMessage({ type: 'SESSION_COMPLETE' }).catch(() => undefined);
  }

  private reportDismissed(): void {
    chrome.runtime.sendMessage({ type: 'SESSION_DISMISSED' }).catch(() => undefined);
  }

  private duckBackground(): Promise<void> {
    return chrome.runtime.sendMessage({ type: 'DUCK_TABS' }).catch(() => undefined) as Promise<void>;
  }

  private restoreBackground(): void {
    chrome.runtime.sendMessage({ type: 'RESTORE_TABS' }).catch(() => undefined);
  }

  private saveMood(emoji: MoodEmoji): void {
    chrome.storage.local
      .get(['moodHistory'])
      .then((result) => {
        const history: Array<{ date: string; emoji: MoodEmoji }> =
          (result['moodHistory'] as Array<{ date: string; emoji: MoodEmoji }>) ?? [];
        history.push({ date: new Date().toISOString(), emoji });
        if (history.length > 90) history.splice(0, history.length - 90);
        chrome.storage.local.set({ moodHistory: history }).catch(() => undefined);
      })
      .catch(() => undefined);
  }
}
