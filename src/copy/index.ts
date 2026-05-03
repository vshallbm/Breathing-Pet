import { en } from './en';
import { hi } from './hi';
import { es } from './es';
import { pt } from './pt';

type Copy = typeof en;

const LOCALES: Record<string, Copy> = {
  'en': en,
  'en-US': en,
  'en-GB': en,
  'hi': hi,
  'hi-IN': hi,
  'es': es,
  'es-ES': es,
  'es-MX': es,
  'es-419': es,
  'pt': pt,
  'pt-BR': pt,
  'pt-PT': pt,
};

/**
 * Returns the copy bundle for a given locale, falling back to English.
 * Usage: const copy = getCopy(settings.locale);
 */
export function getCopy(locale: string): Copy {
  return LOCALES[locale] ?? LOCALES[locale.split('-')[0]] ?? en;
}
