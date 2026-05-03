export type Tier = 'free' | 'plus' | 'premium';
export type CharacterId = 'cat' | 'dog' | 'capybara' | 'red_panda' | 'bunny' | 'penguin' | 'axolotl' | 'zen_frog' | 'otter' | string;
export type CharacterMood = 'calm' | 'hype' | 'sleepy';
export type AudioMode = 'silent' | 'chime' | 'music' | 'voice_calm' | 'voice_hype' | 'voice_savage' | 'voice_custom';
export type Theme = 'light' | 'dark' | 'sepia' | 'forest';
export type ReducedMotion = 'auto' | 'on' | 'off';
export type RampPreset = 'slow' | 'adaptive' | 'ready';
export type MoodEmoji = '😌' | '🙂' | '😐' | '😣';

export interface Settings {
  tier: Tier;
  isPremium: boolean;
  lifetimeUnlocked: boolean;
  enabled: boolean;
  targetSites: string[];
  customSites: string[];
  everywhereMode: boolean;
  rampPreset: RampPreset;
  manualIntervalMinutes: number | null;
  installedAt: string;
  character: CharacterId;
  characterMood: CharacterMood;
  unlockedCharacters: string[];
  customMascotName: string | null;
  pattern: string;
  sessionDurationSeconds: number;
  audioMode: AudioMode;
  musicTrack: string | null;
  customLines: { intro: string | null; outro: string | null };
  reducedMotion: ReducedMotion;
  theme: Theme;
  sleepModeAfter22: boolean;
  buddyMode: boolean;
  streak: {
    totalSessions: number;
    todaySessions: number;
    lastSessionDate: string | null;
  };
  moodHistory: Array<{ date: string; emoji: MoodEmoji }>;
  snoozedUntil: string | null;
  locale: string;
}

export const DEFAULT_SETTINGS: Settings = {
  tier: 'free',
  isPremium: false,
  lifetimeUnlocked: false,
  enabled: true,
  targetSites: [],
  customSites: [],
  everywhereMode: false,
  rampPreset: 'adaptive',
  manualIntervalMinutes: null,
  installedAt: new Date().toISOString(),
  character: 'cat',
  characterMood: 'calm',
  unlockedCharacters: ['cat'],
  customMascotName: null,
  pattern: 'box_4_4_4_4',
  sessionDurationSeconds: 60,
  audioMode: 'silent',
  musicTrack: null,
  customLines: { intro: null, outro: null },
  reducedMotion: 'auto',
  theme: 'light',
  sleepModeAfter22: true,
  buddyMode: false,
  streak: { totalSessions: 0, todaySessions: 0, lastSessionDate: null },
  moodHistory: [],
  snoozedUntil: null,
  locale: 'en-US',
};

export type MessageType =
  | { type: 'SHOW_OVERLAY' }
  | { type: 'HIDE_OVERLAY' }
  | { type: 'TRIGGER_BREAK' }
  | { type: 'SESSION_COMPLETE' }
  | { type: 'SESSION_DISMISSED' }
  | { type: 'SNOOZE'; minutes: number }
  | { type: 'TOGGLE_ENABLED'; enabled: boolean }
  | { type: 'SETTINGS_UPDATED'; settings: Partial<Settings> }
  | { type: 'GET_STATUS'; tabId?: number }
  | { type: 'STATUS_RESPONSE'; snoozedUntil: string | null; enabled: boolean; intervalMinutes: number | null; todaySessions: number; totalSessions: number; character: string; nextAlarmMs: number | null }
  | { type: 'DUCK_TABS' }
  | { type: 'RESTORE_TABS' }
  | { type: 'CHARACTER_UNLOCK'; characterId: string; characterLabel: string }
  | { type: 'BUDDY_START' }
  | { type: 'BUDDY_STOP' }
  | { type: 'APPLY_LICENSE'; key: string }
  | { type: 'OPEN_CHECKOUT' }
  | { type: 'LICENSE_RESULT'; ok: boolean; tier: Tier; error?: string };
