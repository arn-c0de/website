import type { TimelineEntry } from '@/timeline.config'
import type { Locale } from './i18n'
import { entryPath, pick } from './timeline'

/**
 * The timeline as an Atom feed, so the "what is new" half of it can be
 * followed from a feed reader. Only dated entries that are done or in
 * progress go in — a plan is not news yet — and the feed's own `updated` is
 * the newest entry's date rather than the build time, so a rebuild with
 * nothing new does not look like an update to every reader.
 */

const TITLE: Record<Locale, string> = {
  en: 'arn-c0de — timeline',
  de: 'arn-c0de — Zeitstrahl',
}
const SUBTITLE: Record<Locale, string> = {
  en: 'What is in progress and what got done across the arn-c0de projects.',
  de: 'Woran gearbeitet wird und was fertig ist, quer durch die arn-c0de-Projekte.',
}
const STATUS: Record<Locale, Record<'now' | 'done', string>> = {
  en: { now: 'In progress', done: 'Done' },
  de: { now: 'In Arbeit', done: 'Fertig' },
}

/** Feed path per language, relative to the site root. */
export const FEED_PATH: Record<Locale, string> = { en: '/feed.xml', de: '/feed.de.xml' }

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 'YYYY-MM' or 'YYYY-MM-DD' → RFC 3339 at midnight UTC. */
export function feedDate(date: string): string {
  const [day, time] = date.split('T')
  const [y, m, d] = day.split('-')
  return `${y}-${m}-${d ?? '01'}T${time ? `${time.slice(0, 5)}:00` : '00:00:00'}Z`
}

/** Site-relative links ('/timeline/…') made absolute; feed readers have no page to resolve them against. */
function absolute(href: string, siteUrl: string): string {
  return href.startsWith('/') && !href.startsWith('//') ? `${siteUrl}${href}` : href
}

/** Done and in-progress entries with a date, newest first. */
export function feedEntries(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return entries
    .filter((e) => e.status !== 'planned' && e.date)
    .sort((a, b) => (a.date! < b.date! ? 1 : a.date! > b.date! ? -1 : 0))
}

export function buildAtomFeed(entries: readonly TimelineEntry[], locale: Locale, siteUrl: string, max = 30): string {
  const items = feedEntries(entries).slice(0, max)
  const home = `${siteUrl}/`
  const updated = items[0] ? feedDate(items[0].date!) : '1970-01-01T00:00:00Z'
  const lang = locale === 'de' ? 'de' : 'en'

  const body = items.map((e) => {
    // The id stays the timeline anchor it has always been, so readers do
    // not see old entries as new; the link goes to the entry's own page.
    const link = `${home}?tab=timeline#tl-${e.id}`
    const page = `${siteUrl}${entryPath(e.id)}`
    const status = STATUS[locale][e.status as 'now' | 'done']
    const text = [pick(e.text, locale), pick(e.aside, locale)].filter(Boolean).join('\n\n')
    const links = (e.links ?? []).map((l) => `\n    <link rel="related" href="${escapeXml(absolute(l.href, siteUrl))}" title="${escapeXml(pick(l.label, locale))}"/>`)
    const tags = (e.tags ?? []).map((t) => `\n    <category term="${escapeXml(t)}"/>`)
    return `  <entry>
    <id>${escapeXml(link)}</id>
    <title>${escapeXml(pick(e.title, locale))}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(page)}"/>${links.join('')}
    <updated>${feedDate(e.date!)}</updated>
    <category term="${e.status}" label="${escapeXml(status)}"/>${tags.join('')}
    <summary type="text">${escapeXml(text || pick(e.title, locale))}</summary>
  </entry>`
  })

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang}">
  <id>${escapeXml(`${siteUrl}${FEED_PATH[locale]}`)}</id>
  <title>${escapeXml(TITLE[locale])}</title>
  <subtitle>${escapeXml(SUBTITLE[locale])}</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(`${siteUrl}${FEED_PATH[locale]}`)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(`${home}?tab=timeline`)}"/>
  <author><name>arn-c0de</name><uri>https://github.com/arn-c0de</uri></author>
  <updated>${updated}</updated>
${body.join('\n')}
</feed>
`
}
