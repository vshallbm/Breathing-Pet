import type { AudioMode } from '../types';

// Vite ?url imports — each resolves to the hashed public URL at build time
import chimeUrl from '../assets/audio/chime.webm?url';
import lofiUrl from '../assets/audio/music/lofi.webm?url';
import natureUrl from '../assets/audio/music/nature.webm?url';
import bowlUrl from '../assets/audio/music/bowl.webm?url';
import calmIntroUrl from '../assets/audio/voice/calm-intro.webm?url';
import calmOutroUrl from '../assets/audio/voice/calm-outro.webm?url';
import hypeIntroUrl from '../assets/audio/voice/hype-intro.webm?url';
import hypeOutroUrl from '../assets/audio/voice/hype-outro.webm?url';

// Track IDs must match the option values in options.html
export type TrackId = 'lofi_rain' | 'forest' | 'tibetan_bowl';

export interface VoiceClips {
  intro: string;
  outro: string;
}

export const FREE_TRACKS: TrackId[] = ['lofi_rain', 'forest', 'tibetan_bowl'];

const MUSIC_URLS: Record<TrackId, string> = {
  lofi_rain: lofiUrl,
  forest: natureUrl,
  tibetan_bowl: bowlUrl,
};

const VOICE_URLS: Partial<Record<AudioMode, VoiceClips>> = {
  voice_calm: { intro: calmIntroUrl, outro: calmOutroUrl },
  voice_hype: { intro: hypeIntroUrl, outro: hypeOutroUrl },
};

export function getChimeUrl(): string {
  return chimeUrl;
}

export function getMusicUrl(trackId: string): string | null {
  return MUSIC_URLS[trackId as TrackId] ?? null;
}

export function getVoiceClips(mode: AudioMode): VoiceClips | null {
  return VOICE_URLS[mode] ?? null;
}

export function isVoiceMode(mode: AudioMode): boolean {
  return mode === 'voice_calm' || mode === 'voice_hype' || mode === 'voice_savage' || mode === 'voice_custom';
}

export function isPaywalledVoice(mode: AudioMode): boolean {
  return mode === 'voice_savage' || mode === 'voice_custom';
}
