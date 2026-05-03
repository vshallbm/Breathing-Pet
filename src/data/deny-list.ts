// Patterns matched against hostname. Never interrupted.
export const DENY_LIST_EXACT: string[] = [
  'paypal.com',
  'venmo.com',
  'robinhood.com',
  'bitwarden.com',
  '1password.com',
  'lastpass.com',
  'dashlane.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
  'drive.google.com',
  'github.com',
  'gitlab.com',
  'figma.com',
  'notion.so',
  'linear.app',
  'jira.com',
  'asana.com',
  'monday.com',
  'trello.com',
  'slack.com',
  'discord.com',
  'teams.microsoft.com',
  'confluence.atlassian.com',
  'atlassian.net',
];

export const DENY_LIST_SUFFIXES: string[] = [
  '.bankofamerica.com',
  '.chase.com',
  '.wellsfargo.com',
  '.citi.com',
  '.coinbase.com',
  '.fidelity.com',
  '.vanguard.com',
  '.mychart.org',
  '.epic.com',
  '.kaiserpermanente.org',
  '.cigna.com',
  '.aetna.com',
  '.gov',
  '.gov.uk',
  '.gov.in',
  '.gob.mx',
  '.gov.au',
  '.gc.ca',
];

export const DENY_LIST_HOSTNAME_KEYWORDS: string[] = ['bank', 'credit'];

export const DENY_LIST_PATH_PATTERNS: string[] = [
  '/checkout',
  '/cart',
  '/payment',
  '/billing',
  '/order',
  '/patient',
  '/medical-records',
  '/prescriptions',
];

export function isDenyListedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  if (DENY_LIST_EXACT.includes(h)) return true;
  for (const suffix of DENY_LIST_SUFFIXES) {
    if (h.endsWith(suffix) || h === suffix.replace(/^\./, '')) return true;
  }
  for (const kw of DENY_LIST_HOSTNAME_KEYWORDS) {
    if (h.includes(kw)) return true;
  }
  return false;
}

export function isDenyListedPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return DENY_LIST_PATH_PATTERNS.some(pattern => p.startsWith(pattern));
}
