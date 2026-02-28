/** Capitalizes the first letter of every word (handles hyphens too). Display-only — never mutates stored data. */
export function capitalizeName(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}
