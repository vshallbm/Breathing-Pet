import { describe, it, expect, afterEach } from 'vitest';
import {
  isUserTyping,
  isFullscreen,
  isPiP,
  shouldSuppressOverlay,
} from '../src/lib/guards';

// jsdom provides document.activeElement, window.location, etc.

describe('isUserTyping', () => {
  afterEach(() => {
    // Restore focus to body
    (document.activeElement as HTMLElement | null)?.blur?.();
  });

  it('returns false when body has focus', () => {
    expect(isUserTyping()).toBe(false);
  });

  it('returns true when an input is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(isUserTyping()).toBe(true);
    document.body.removeChild(input);
  });

  it('returns true when a textarea is focused', () => {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    expect(isUserTyping()).toBe(true);
    document.body.removeChild(ta);
  });

  it('returns true for contenteditable element', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    // jsdom focus() on non-native-focusable elements is unreliable; stub activeElement
    const originalDesc = Object.getOwnPropertyDescriptor(document, 'activeElement');
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => div });
    expect(isUserTyping()).toBe(true);
    // Restore native activeElement tracking
    if (originalDesc) {
      Object.defineProperty(document, 'activeElement', originalDesc);
    } else {
      delete (document as unknown as Record<string, unknown>).activeElement;
    }
    document.body.removeChild(div);
  });

  it('returns false for a non-interactive div', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.focus();
    expect(isUserTyping()).toBe(false);
    document.body.removeChild(div);
  });
});

describe('isFullscreen', () => {
  it('returns false when not fullscreen (jsdom default)', () => {
    expect(isFullscreen()).toBe(false);
  });

  it('returns true when document.fullscreenElement is set', () => {
    const div = document.createElement('div');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => div,
    });
    expect(isFullscreen()).toBe(true);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
  });
});

describe('isPiP', () => {
  it('returns false when no PiP element (jsdom default)', () => {
    expect(isPiP()).toBe(false);
  });
});

describe('shouldSuppressOverlay', () => {
  it('returns suppressed=false on a clean page', () => {
    // jsdom default location is 'about:blank', which passes deny-list
    const result = shouldSuppressOverlay();
    expect(result.suppressed).toBe(false);
  });

  it('suppresses when user is typing', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const result = shouldSuppressOverlay();
    expect(result.suppressed).toBe(true);
    expect(result.reason).toBe('typing');
    document.body.removeChild(input);
    input.blur();
  });

  it('suppresses when fullscreen is active', () => {
    const div = document.createElement('div');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => div,
    });
    const result = shouldSuppressOverlay();
    expect(result.suppressed).toBe(true);
    expect(result.reason).toBe('fullscreen');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
  });

  it('suppresses on a deny-listed hostname', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'paypal.com', pathname: '/' },
    });
    const result = shouldSuppressOverlay();
    expect(result.suppressed).toBe(true);
    expect(result.reason).toBe('deny-listed');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'localhost', pathname: '/' },
    });
  });

  it('suppresses on a deny-listed path (/checkout)', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'shop.example.com', pathname: '/checkout/confirm' },
    });
    const result = shouldSuppressOverlay();
    expect(result.suppressed).toBe(true);
    expect(result.reason).toBe('deny-listed');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname: 'localhost', pathname: '/' },
    });
  });
});
