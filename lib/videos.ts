import type { TimelineEntry, YouTubeSettings } from '@/timeline.config'
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
      return {
        id: `yt-${v.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
        status: o.status ?? 'done',
        date: v.date,
        title: o.title ?? v.title,
        text: o.text ?? v.summary,
        layout: i % 2 === 0 ? 'image-right' : 'image-left',
        media: [{ youtube: v.id, title: v.title, ...(v.poster ? { poster: v.poster } : {}) }],
        tags: o.tags ?? (v.short ? ['video', 'short'] : ['video']),
        project: project && known.has(project) ? project : undefined,
      } satisfies TimelineEntry
    })
}
