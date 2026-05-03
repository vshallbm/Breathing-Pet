import { describe, it, expect } from 'vitest';
import { getCopy } from '../src/copy/index';
import { en } from '../src/copy/en';
import { hi } from '../src/copy/hi';
import { es } from '../src/copy/es';
import { pt } from '../src/copy/pt';

describe('getCopy', () => {
  it('returns English for en-US', () => {
    expect(getCopy('en-US')).toBe(en);
  });

  it('returns English for en-GB', () => {
    expect(getCopy('en-GB')).toBe(en);
  });

  it('returns English for unknown locale (fallback)', () => {
    expect(getCopy('fr-FR')).toBe(en);
    expect(getCopy('')).toBe(en);
  });

  it('returns Hindi for hi-IN', () => {
    expect(getCopy('hi-IN')).toBe(hi);
  });

  it('returns Spanish for es-ES', () => {
    expect(getCopy('es-ES')).toBe(es);
  });

  it('returns Spanish for es-MX (regional variant)', () => {
    expect(getCopy('es-MX')).toBe(es);
  });

  it('returns Portuguese for pt-BR', () => {
    expect(getCopy('pt-BR')).toBe(pt);
  });

  it('returns Portuguese for pt-PT', () => {
    expect(getCopy('pt-PT')).toBe(pt);
  });
});

describe('English copy shape', () => {
  it('has all required phase labels', () => {
    const { phase } = en;
    expect(phase.inhale).toBeTruthy();
    expect(phase.holdIn).toBeTruthy();
    expect(phase.exhale).toBeTruthy();
    expect(phase.holdOut).toBeTruthy();
  });

  it('streakInc formats singular correctly', () => {
    expect(en.streakInc(1)).toMatch(/1 session\b/);
    expect(en.streakInc(1)).not.toMatch(/sessions/);
  });

  it('streakInc formats plural correctly', () => {
    expect(en.streakInc(5)).toMatch(/5 sessions/);
  });

  it('popup.sessionsToday formats correctly', () => {
    expect(en.popup.sessionsToday(1)).toMatch(/1 session\b/);
    expect(en.popup.sessionsToday(3)).toMatch(/3 sessions/);
  });

  it('popup.snoozedUntil includes time string', () => {
    expect(en.popup.snoozedUntil('3:00 PM')).toMatch(/3:00 PM/);
  });

  it('has overlay exit/done/yes/no keys', () => {
    expect(en.overlay.exit).toBeTruthy();
    expect(en.overlay.done).toBeTruthy();
    expect(en.overlay.yes).toBeTruthy();
    expect(en.overlay.no).toBeTruthy();
  });
});

describe('Hindi copy shape', () => {
  it('has all phase labels', () => {
    expect(hi.phase.inhale).toBeTruthy();
    expect(hi.phase.exhale).toBeTruthy();
  });

  it('has overlay keys', () => {
    expect(hi.overlay.exit).toBeTruthy();
    expect(hi.overlay.done).toBeTruthy();
  });

  it('streakInc returns non-empty string', () => {
    expect(hi.streakInc(3)).toBeTruthy();
    expect(typeof hi.streakInc(3)).toBe('string');
  });
});

describe('Spanish copy shape', () => {
  it('has all phase labels', () => {
    expect(es.phase.inhale).toBeTruthy();
    expect(es.phase.holdIn).toBeTruthy();
    expect(es.phase.exhale).toBeTruthy();
    expect(es.phase.holdOut).toBeTruthy();
  });

  it('has overlay yes/no/exit/done', () => {
    expect(es.overlay.yes).toBeTruthy();
    expect(es.overlay.no).toBeTruthy();
    expect(es.overlay.exit).toBeTruthy();
    expect(es.overlay.done).toBeTruthy();
  });

  it('streakInc singular avoids plural suffix', () => {
    const s = es.streakInc(1);
    expect(s).toContain('1');
    expect(s).not.toMatch(/sesiones/);
  });

  it('streakInc plural uses correct form', () => {
    expect(es.streakInc(3)).toMatch(/sesiones/);
  });
});

describe('Portuguese copy shape', () => {
  it('has all phase labels', () => {
    expect(pt.phase.inhale).toBeTruthy();
    expect(pt.phase.exhale).toBeTruthy();
  });

  it('popup.snoozedUntil includes time string', () => {
    expect(pt.popup.snoozedUntil('14:00')).toMatch(/14:00/);
  });

  it('streakInc returns correct form for plural', () => {
    expect(pt.streakInc(2)).toMatch(/sessões/);
  });
});
