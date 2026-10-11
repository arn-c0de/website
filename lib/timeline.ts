import videoData from '@/data/videos.json'
import timeline, { youtube, type Localized, type TimelineEntry, type TimelineStatus } from '@/timeline.config'
import type { Locale } from './i18n'
import type { Project } from './types'
import { videoEntries } from './videos'
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

/** 'YYYY-MM' → "Oct 2026", 'YYYY-MM-DD' → "11 Oct 2026", in the page language. */
export function formatTimelineDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split('-').map(Number)
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
      return a.index - b.index
    })
    .map(({ entry }) => entry)
}

/** The hand-written entries plus the channel's videos, fetched at build time. */
export function allTimelineEntries(projects: readonly Pick<Project, 'name' | 'title'>[]): TimelineEntry[] {
  return [...timeline, ...videoEntries((videoData as VideoData).videos, youtube, projects, timeline)]
}

/** Done and in-progress entries, newest first — what the overview calls "latest". */
export function latestEntries(entries: readonly TimelineEntry[], count: number): TimelineEntry[] {
  return entries
    .filter((e) => e.status !== 'planned' && e.date)
    .sort((a, b) => (a.date! < b.date! ? 1 : a.date! > b.date! ? -1 : 0))
    .slice(0, count)
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
