import { languageHue } from './format'
import type { Project } from './types'

/**
 * Aggregations behind the Stack pane's charts. Everything here is derived from
 * the repository list alone — no hand-kept numbers, and nothing depends on the
 * current time or the visitor's locale, so the prerendered HTML and the first
 * client render agree down to the last label.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Guard against a stray far-past date turning the axis into a thousand ticks. */
const MAX_MONTHS = 72

export interface LanguageSlice {
  name: string
  count: number
  /** Fraction of the repositories that name a language — the ring's arc. */
  share: number
  hue: number
}

export interface ActivityMonth {
  /** First instant of the month, UTC. Also the x position of its grid line. */
  at: number
  /** 'Jan' … 'Dec'. */
  label: string
  /** Two-digit year, rendered only where the year turns over. */
  year: string
  /** Repositories created in this month. */
  started: number
  /** Repositories between their first commit and their last push. */
  active: number
}

export interface ProjectSpan {
  name: string
  title: string
  language: string | null
  hue: number
  /** created_at and pushed_at as epoch ms. */
  from: number
  to: number
  stars: number
}

export function languageShare(projects: Project[]): LanguageSlice[] {
  const counts = new Map<string, number>()
  for (const p of projects) {
    if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1)
  }

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({
      name,
      count,
      share: total === 0 ? 0 : count / total,
      hue: languageHue(name),
    }))
}

/** Start of the month a timestamp falls in, in UTC. */
function monthStart(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}

/** The same month one step later — month arithmetic that survives December. */
function nextMonth(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
}

/** The same month one step earlier — used to retain the recent end of a long history. */
function previousMonth(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)
}

/**
 * One bucket per month between the oldest repository and the most recent push.
 * `started` counts first appearances, `active` counts repositories whose window
 * from creation to last push covers the month — together they read as "how much
 * was running when", rather than as a single flat total.
 */
export function monthlyActivity(projects: Project[]): ActivityMonth[] {
  const spans = projectSpans(projects)
  if (spans.length === 0) return []

  const oldest = monthStart(Math.min(...spans.map((s) => s.from)))
  const last = monthStart(Math.max(...spans.map((s) => s.to)))
  // Keep the useful end of a long history. Starting at the oldest date would
  // make a repository from 1998 hide all activity after 2003.
  let first = last
  for (let count = 1; count < MAX_MONTHS && previousMonth(first) >= oldest; count++) {
    first = previousMonth(first)
  }

  const months: ActivityMonth[] = []
  for (let at = first; at <= last && months.length < MAX_MONTHS; at = nextMonth(at)) {
    const end = nextMonth(at)
    const date = new Date(at)
    months.push({
      at,
      label: MONTHS[date.getUTCMonth()],
      year: String(date.getUTCFullYear() % 100).padStart(2, '0'),
      started: spans.filter((s) => s.from >= at && s.from < end).length,
      active: spans.filter((s) => s.from < end && s.to >= at).length,
    })
  }

  return months
}

/** The x domain the activity chart and the timeline share: [first month, end of last]. */
export function activityDomain(months: ActivityMonth[]): [number, number] {
  if (months.length === 0) return [0, 1]
  return [months[0].at, nextMonth(months[months.length - 1].at)]
}

/** One lane per project, oldest first — a repository's life from first commit to last push. */
export function projectSpans(projects: Project[]): ProjectSpan[] {
  return projects
    .filter((p) => p.created_at && p.pushed_at)
    .map((p) => {
      const from = Date.parse(p.created_at)
      const to = Date.parse(p.pushed_at)
      return {
        name: p.name,
        title: p.title,
        language: p.language,
        hue: languageHue(p.language),
        from,
        // A push timestamp older than the creation date would draw backwards.
        to: Math.max(to, from),
        stars: p.stargazers_count,
      }
    })
    .filter((s) => Number.isFinite(s.from) && Number.isFinite(s.to))
    .sort((a, b) => a.from - b.from || a.title.localeCompare(b.title))
}

/** "8 months", "1 year 2 months" — how long a project stayed in motion. */
export function formatSpan(from: number, to: number): string {
  const months = Math.max(1, Math.round((to - from) / 2_629_800_000))
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const head = `${years} year${years === 1 ? '' : 's'}`
  return rest === 0 ? head : `${head} ${rest} month${rest === 1 ? '' : 's'}`
}
