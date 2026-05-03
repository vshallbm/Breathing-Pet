import { describe, it, expect } from 'vitest';
import { isDenyListedHost, isDenyListedPath } from '../src/data/deny-list';

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
