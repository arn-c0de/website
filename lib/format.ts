/** "Aug 2026" — month precision is enough for a last-pushed timestamp. */
export function formatMonth(iso: string, locale: 'en' | 'de' = 'en'): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

/** "3 months ago", "2 years ago" — relative to now, coarse on purpose. */
export function formatRelative(iso: string, locale: 'en' | 'de' = 'en'): string {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return '—'
  const days = Math.floor((Date.now() - time) / 86_400_000)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  if (locale === 'de') {
    if (days < 1) return 'heute'
    if (days < 30) return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`
    if (months < 12) return months === 1 ? 'vor 1 Monat' : `vor ${months} Monaten`
    return years === 1 ? 'vor 1 Jahr' : `vor ${years} Jahren`
  }
  if (days < 1) return 'today'
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/**
 * Hues for the languages these repositories actually use, picked to sit
 * together as one palette — cool blues and violets for the bulk, a few warm
 * accents spaced well apart. A hash of the name would scatter them around
 * the wheel and land neighbours on clashing oranges and limes.
 */
const LANGUAGE_HUES: Record<string, number> = {
  Python: 214,
  'C++': 238,
  C: 192,
  'C#': 274,
  Rust: 18,
  Java: 32,
  JavaScript: 46,
  TypeScript: 204,
  Kotlin: 300,
  Shell: 152,
  Go: 182,
  HTML: 10,
  CSS: 258,
  Dart: 196,
  Swift: 8,
}

/** Stable colour per language, so the same tech always reads the same. */
export function languageHue(language: string | null): number {
  if (!language) return 220
  const known = LANGUAGE_HUES[language]
  if (known !== undefined) return known
  let hash = 0
  for (let i = 0; i < language.length; i++) hash = (hash * 31 + language.charCodeAt(i)) % 360
  return hash
}
