interface CrisisResource {
  label: string;
  url: string;
}

// Keyed by ISO 3166-1 alpha-2 country code derived from navigator.language
const CRISIS_RESOURCES: Record<string, CrisisResource> = {
  US: { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org' },
  GB: { label: 'Samaritans', url: 'https://www.samaritans.org' },
  CA: { label: 'Crisis Services Canada', url: 'https://www.crisisservicescanada.ca' },
  AU: { label: 'Beyond Blue', url: 'https://www.beyondblue.org.au' },
  NZ: { label: 'Lifeline Aotearoa', url: 'https://www.lifeline.org.nz' },
  IN: { label: 'iCall', url: 'https://icallhelpline.org' },
  IE: { label: 'Samaritans Ireland', url: 'https://www.samaritans.org/ireland' },
  ZA: { label: 'SADAG', url: 'https://www.sadag.org' },
  DE: { label: 'Telefonseelsorge', url: 'https://www.telefonseelsorge.de' },
  FR: { label: '3114 – Numéro national de prévention du suicide', url: 'https://3114.fr' },
  BR: { label: 'CVV', url: 'https://www.cvv.org.br' },
  MX: { label: 'SAPTEL', url: 'https://www.saptel.org.mx' },
  ES: { label: 'Teléfono de la Esperanza', url: 'https://www.telefonodelaesperanza.org' },
  PT: { label: 'SOS Voz Amiga', url: 'https://www.sosvozamiga.org' },
  AR: { label: 'Centro de Asistencia al Suicida', url: 'https://www.asistenciaalsuicida.org.ar' },
  JP: { label: 'よりそいホットライン', url: 'https://www.since2011.net/yorisoi' },
  KR: { label: '자살예방상담전화', url: 'https://www.1393.or.kr' },
};

const DEFAULT: CrisisResource = { label: 'Need real support?', url: 'https://findahelpline.com' };

function countryFromLocale(locale: string): string {
  // "en-US" → "US", "pt-BR" → "BR", "en" → ""
  const parts = locale.split('-');
  return parts.length >= 2 ? parts[parts.length - 1].toUpperCase() : '';
}

export function getCrisisResource(locale?: string): CrisisResource {
  const tag = locale ?? navigator.language ?? '';
  const country = countryFromLocale(tag);
  return CRISIS_RESOURCES[country] ?? DEFAULT;
}
