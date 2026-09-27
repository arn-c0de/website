/** "Aug 2026" — month precision is enough for a last-pushed timestamp. */
export function formatMonth(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

/** "3 months ago", "2 years ago" — relative to now, coarse on purpose. */
export function formatRelative(iso: string): string {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return '—'
  const days = Math.floor((Date.now() - time) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

/** Stable colour per language, so the same tech always reads the same. */
export function languageHue(language: string | null): number {
  if (!language) return 220
  let hash = 0
  for (let i = 0; i < language.length; i++) hash = (hash * 31 + language.charCodeAt(i)) % 360
  return hash
}
