/** Capitalizes the first letter of every word (handles hyphens too). Display-only — never mutates stored data. */
export function capitalizeName(text: string): string {
  return text.replace(/(^|[\s-])(\p{L})/gu, (_, sep, char) => sep + char.toLocaleUpperCase('es'));
}

/** Formats a Date as a human-readable day + month string for the given locale. */
export function formatPhaseDate(date: Date, locale: 'es' | 'en'): string {
  return date.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'long',
  });
}
