import { describe, it, expect } from 'vitest';
import { isDenyListedHost, isDenyListedPath } from '../src/data/deny-list';
import { isInjectableUrl } from '../src/lib/guards';

describe('isDenyListedHost', () => {
  it('blocks exact match', () => { expect(isDenyListedHost('paypal.com')).toBe(true); });
  it('blocks bank suffix', () => { expect(isDenyListedHost('www.chase.com')).toBe(true); });
  it('blocks gov TLD', () => { expect(isDenyListedHost('irs.gov')).toBe(true); });
  it('allows target sites', () => { expect(isDenyListedHost('instagram.com')).toBe(false); });
  it('blocks hostname with "bank"', () => { expect(isDenyListedHost('mybank.example.com')).toBe(true); });
});

describe('isDenyListedPath', () => {
  it('blocks /checkout', () => { expect(isDenyListedPath('/checkout/confirm')).toBe(true); });
  it('allows /home', () => { expect(isDenyListedPath('/home')).toBe(false); });
});

describe('isInjectableUrl', () => {
  it('returns true for https URL', () => { expect(isInjectableUrl('https://example.com')).toBe(true); });
  it('returns true for http URL', () => { expect(isInjectableUrl('http://localhost:3000')).toBe(true); });
  it('returns false for chrome:// URL', () => { expect(isInjectableUrl('chrome://newtab/')).toBe(false); });
  it('returns false for chrome-extension:// URL', () => { expect(isInjectableUrl('chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/')).toBe(false); });
  it('returns false for file:// URL', () => { expect(isInjectableUrl('file:///Users/alice/doc.pdf')).toBe(false); });
  it('returns false for empty string', () => { expect(isInjectableUrl('')).toBe(false); });
  it('returns false for about:blank', () => { expect(isInjectableUrl('about:blank')).toBe(false); });
});
