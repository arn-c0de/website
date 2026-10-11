import type { Localized, TimelineEntry, YouTubeSettings } from '@/timeline.config'
import type { StoredVideo } from './youtube-feed'

/** Enough of a project to recognise it in a video's title or text. */
interface ProjectName {
  name: string
  title: string
}

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The repository a video is about, if its title (or failing that, its
 * summary) names one. Longer names win, so "ESP32-LoRa-Mesh-Server" beats
 * "ESP32-LABs" and "QLink-preview" is found as "QLink".
 */
export function guessProject(video: Pick<StoredVideo, 'title' | 'summary'>, projects: readonly ProjectName[]) {
  const candidates = projects
    .flatMap((p) => [p.title, p.name, p.name.replace(/-preview$/i, '')].map((label) => ({ label, name: p.name })))
    .filter((c) => c.label.length >= 4)
    .sort((a, b) => b.label.length - a.label.length)
  for (const text of [video.title, video.summary]) {
    for (const c of candidates) {
      if (new RegExp(`(^|[^\\p{L}\\p{N}])${escape(c.label)}([^\\p{L}\\p{N}]|$)`, 'iu').test(text)) return c.name
    }
  }
  return undefined
}

/**
 * Channel videos as timeline entries. Pictures alternate sides so a run of
 * videos does not read as one long column, and a video already placed in
 * the config by hand is not shown twice.
 */
/**
 * Whether a video is 18+ on YouTube: flagged on the entry, listed by id, or
 * carrying one of the configured words in its title (either language).
 */
export function isAgeRestricted(
  id: string | null,
  title: Localized | undefined,
  flagged: boolean | undefined,
  rules: YouTubeSettings['ageRestricted'],
): boolean {
  if (flagged) return true
  if (!rules) return false
  if (id && rules.ids.includes(id)) return true
  const text = (typeof title === 'string' ? title : title ? `${title.en} ${title.de}` : '').toLowerCase()
  return rules.titleIncludes.some((word) => text.includes(word.toLowerCase()))
}

export function videoEntries(
  videos: readonly StoredVideo[],
  settings: YouTubeSettings,
  projects: readonly ProjectName[],
  manual: readonly TimelineEntry[],
): TimelineEntry[] {
  const placed = new Set(
    manual.flatMap((e) => (e.media ?? []).flatMap((m) => ('youtube' in m ? [m.youtube] : []))),
  )
  const known = new Set(projects.map((p) => p.name))
  return videos
    .filter((v) => !settings.hidden.includes(v.id))
    .filter((v) => settings.includeShorts || !v.short)
    .filter((v) => ![...placed].some((link) => link === v.id || link.includes(v.id)))
    .slice(0, settings.max)
    .map((v, i) => {
      const o = settings.overrides[v.id] ?? {}
      const project = o.project ?? guessProject(v, projects)
      const restricted = isAgeRestricted(v.id, v.title, false, settings.ageRestricted)
      const note = settings.ageRestricted?.note
      // The reason goes into the text too, not only onto the frame.
      const text: Localized =
        o.text ??
        (restricted && note
          ? {
              en: `${v.summary} ${typeof note === 'string' ? note : note.en}`.trim(),
              de: `${v.summary} ${typeof note === 'string' ? note : note.de}`.trim(),
            }
          : v.summary)
      return {
        id: `yt-${v.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
        status: o.status ?? 'done',
        date: v.date,
        title: o.title ?? v.title,
        text,
        layout: i % 2 === 0 ? 'image-right' : 'image-left',
        media: [
          {
            youtube: v.id,
            title: v.title,
            ...(v.poster ? { poster: v.poster } : {}),
            ...(restricted ? { ageRestricted: true } : {}),
          },
        ],
        tags: o.tags ?? (v.short ? ['video', 'short'] : ['video']),
        project: project && known.has(project) ? project : undefined,
      } satisfies TimelineEntry
    })
}
