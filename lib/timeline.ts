import videoData from '@/data/videos.json'
import timeline, { youtube, type Localized, type TimelineEntry, type TimelineStatus, type TimelineYouTube } from '@/timeline.config'
import type { Locale } from './i18n'
import type { Project } from './types'
import { isAgeRestricted, videoEntries } from './videos'
import type { VideoData } from './youtube-feed'
import { youtubeId } from './video'

const ORDER: TimelineStatus[] = ['planned', 'now', 'done']

export function hasVideo(entry: TimelineEntry) {
  return (entry.media ?? []).some((m) => 'youtube' in m || 'video' in m)
}

export function pick(value: Localized | undefined, locale: Locale): string {
  if (value === undefined) return ''
  return typeof value === 'string' ? value : value[locale]
}

/**
 * 'YYYY-MM' → "Oct 2026", 'YYYY-MM-DD' → "11 Oct 2026", in the page language.
 * A time after the day ('YYYY-MM-DDTHH:MM') only orders entries; it is not shown.
 */
export function formatTimelineDate(date: string, locale: Locale): string {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  if (!y || !m) return date
  const value = new Date(Date.UTC(y, m - 1, d || 1))
  return value.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    timeZone: 'UTC',
    ...(d ? { day: 'numeric' } : {}),
    month: 'short',
    year: 'numeric',
  })
}

/** Planned first, then in progress, then done; newest first inside each. */
export function sortTimeline(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const status = ORDER.indexOf(a.entry.status) - ORDER.indexOf(b.entry.status)
      if (status !== 0) return status
      const dateA = a.entry.date ?? ''
      const dateB = b.entry.date ?? ''
      if (dateA !== dateB) return dateA < dateB ? 1 : -1
      // Same day and no time to tell them apart: the order in the config,
      // where newer entries go on top.
      return a.index - b.index
    })
    .map(({ entry }) => entry)
}

/** The hand-written entries plus the channel's videos, fetched at build time. */
export function allTimelineEntries(projects: readonly Pick<Project, 'name' | 'title'>[]): TimelineEntry[] {
  const stored = (videoData as VideoData).videos
  return [...timeline.map((entry) => withFetchedPosters(entry, stored)), ...videoEntries(stored, youtube, projects, timeline)]
}

/**
 * A YouTube video placed by hand has no thumbnail of its own; once the
 * deploy has fetched the channel, it borrows the local copy from there, so
 * the entry shows the real still without the page asking YouTube for it.
 */
function withFetchedPosters(entry: TimelineEntry, stored: VideoData['videos']): TimelineEntry {
  if (!entry.media?.some((m) => 'youtube' in m && !m.poster)) return entry
  return {
    ...entry,
    media: entry.media.map((m) => {
      if (!('youtube' in m) || m.poster) return m
      const id = youtubeId(m.youtube)
      const poster = stored.find((v) => v.id === id)?.poster
      return poster ? { ...m, poster } : m
    }),
  }
}

/** Done and in-progress entries, newest first — what the overview calls "latest". */
export function latestEntries(entries: readonly TimelineEntry[], count: number): TimelineEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status !== 'planned' && entry.date)
    .sort((a, b) => (a.entry.date! < b.entry.date! ? 1 : a.entry.date! > b.entry.date! ? -1 : a.index - b.index))
    .slice(0, count)
    .map(({ entry }) => entry)
}

/** The picture that stands for an entry: a poster, an image or nothing. */
export function entryVisual(entry: TimelineEntry): { src: string; video: boolean } | null {
  for (const m of [...(entry.media ?? []), ...(entry.images ?? [])]) {
    if ('src' in m) return { src: m.src, video: false }
    if ('poster' in m && m.poster) return { src: m.poster, video: true }
    if ('youtube' in m && youtubeId(m.youtube)) return null
  }
  return null
}

/** Done and in-progress entries with a date get a page of their own. */
export function entryHasPage(entry: Pick<TimelineEntry, 'status' | 'date'>): boolean {
  return entry.status !== 'planned' && !!entry.date
}

/** Site-relative path of an entry's page, without the base path. */
export function entryPath(id: string): string {
  return `/timeline/${id}/`
}

/** Paragraphs of a localized text block, split on blank lines. */
export function paragraphs(value: Localized | undefined, locale: Locale): string[] {
  return pick(value, locale)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** The reason a video is 18+ on YouTube, or null when it plays embedded. */
export function ageRestriction(video: TimelineYouTube): Localized | null {
  const restricted = isAgeRestricted(youtubeId(video.youtube), video.title, video.ageRestricted, youtube.ageRestricted)
  return restricted ? (youtube.ageRestricted?.note ?? { en: 'Age-restricted on YouTube (18+).', de: 'Auf YouTube ab 18 freigegeben.' }) : null
}
