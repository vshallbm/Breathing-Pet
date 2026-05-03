import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCrisisResource } from '../src/lib/crisis';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCrisisResource', () => {
  it('returns 988 Lifeline for en-US', () => {
    const r = getCrisisResource('en-US');
    expect(r.url).toContain('988lifeline');
    expect(r.label).toBeTruthy();
  });

  it('returns Samaritans for en-GB', () => {
    const r = getCrisisResource('en-GB');
    expect(r.url).toContain('samaritans');
  });

  it('returns Crisis Services Canada for en-CA', () => {
    const r = getCrisisResource('en-CA');
    expect(r.url).toContain('crisisservicescanada');
  });

  it('returns Beyond Blue for en-AU', () => {
    const r = getCrisisResource('en-AU');
    expect(r.url).toContain('beyondblue');
  });

  it('returns iCall for hi-IN', () => {
    const r = getCrisisResource('hi-IN');
    expect(r.url).toContain('icall');
  });

  it('returns CVV for pt-BR', () => {
    const r = getCrisisResource('pt-BR');
    expect(r.url).toContain('cvv.org.br');
  });

  it('returns SAPTEL for es-MX', () => {
    const r = getCrisisResource('es-MX');
    expect(r.url).toContain('saptel');
  });

  it('returns findahelpline default for unknown locale', () => {
    const r = getCrisisResource('xx-XX');
    expect(r.url).toContain('findahelpline');
  });

  it('returns default for bare language code with no country', () => {
    const r = getCrisisResource('en');
    expect(r.url).toContain('findahelpline');
  });

  it('falls back to navigator.language when no argument given', () => {
    vi.stubGlobal('navigator', { language: 'en-AU' });
    const r = getCrisisResource();
    expect(r.url).toContain('beyondblue');
  });

  it('returns Teléfono de la Esperanza for es-ES', () => {
    const r = getCrisisResource('es-ES');
    expect(r.url).toContain('telefonodelaesperanza');
  });

  it('returns SOS Voz Amiga for pt-PT', () => {
    const r = getCrisisResource('pt-PT');
    expect(r.url).toContain('sosvozamiga');
  });

  it('all resources have non-empty label and url', () => {
    const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'en-NZ', 'hi-IN', 'en-IE', 'en-ZA', 'de-DE', 'fr-FR', 'pt-BR', 'es-MX', 'es-ES', 'pt-PT', 'es-AR', 'ja-JP', 'ko-KR'];
    for (const locale of locales) {
      const r = getCrisisResource(locale);
      expect(r.label, `label for ${locale}`).toBeTruthy();
      expect(r.url, `url for ${locale}`).toMatch(/^https?:\/\//);
    }
  });
});
