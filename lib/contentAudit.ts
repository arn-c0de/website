import type { SiteConfig } from '@/projects.config'
import type { TimelineEntry } from '@/timeline.config'
import type { GitHubRepo } from './types'

/**
 * What on the site is missing, broken or out of date. `npm run content:audit`
 * prints it; CONTENT.md says how to fix each kind. Pure, so the tests can feed
 * it a fixed date and made-up repositories.
 *
 *   error  something on the site points at nothing — fix before pushing
 *   warn   the site says something that is probably no longer true
 *   info   a gap worth filling when there is time
 */
export type AuditLevel = 'error' | 'warn' | 'info'

export interface AuditFinding {
  level: AuditLevel
  /** Stable key for the kind of finding; CONTENT.md has a section per kind. */
  kind: string
  /** The repository name or timeline id the finding is about. */
  subject: string
  message: string
}

export interface AuditInput {
  repos: readonly GitHubRepo[]
  config: SiteConfig
  /** Names of the private projects in lib/privateProjects.ts. */
  privateNames: readonly string[]
  timeline: readonly TimelineEntry[]
  /** Slugs listed in data/repo-icons.json. */
  icons: readonly string[]
  /** `reviewed` from now.config.ts — when "Currently building" was last checked. */
  nowReviewed?: string
  /** Whether a path under public/ exists, e.g. '/timeline/x.webp'. */
  publicFileExists: (path: string) => boolean
  now: Date
}

const DAY = 86_400_000
/** A 'now' entry older than this is probably done, or needs a newer update. */
export const STALE_NOW_DAYS = 45
/** Pushes this long after a project's newest timeline entry are worth a post. */
export const ACTIVITY_GAP_DAYS = 30
/** The "Currently building" list is checked again after this long. */
export const NOW_REVIEW_DAYS = 60
/** Descriptions shorter than this read as a placeholder on a card. */
export const THIN_DESCRIPTION = 50

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const tidy = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

/** First moment after the period a date names: 2026-10 → 1 Nov 2026. */
function periodEnd(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return d ? new Date(Date.UTC(y, m - 1, d + 1)) : new Date(Date.UTC(y, m, 1))
}

function periodStart(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d || 1))
}

function isVisible(repo: GitHubRepo, config: SiteConfig): boolean {
  const o = config.overrides[repo.name]
  if (config.hidden.includes(repo.name) || o?.hidden) return false
  if (o?.show) return true
  if (repo.fork && !config.showForks) return false
  if (repo.archived && !config.showArchived) return false
  return true
}

/**
 * Whether a timeline entry is about a project: by its `project` or `mentions`, or —
 * for entries written before that field existed — by the project's name in
 * the entry's id or tags.
 */
export function entryIsAbout(entry: TimelineEntry, name: string, title: string): boolean {
  if (entry.mentions?.includes(name)) return true
  if (entry.project) return entry.project === name
  const keys = [slug(name), slug(title)].filter((k) => k.length >= 4)
  const haystack = [entry.id, ...(entry.tags ?? [])].map(slug)
  return keys.some((k) => haystack.some((h) => h.includes(k)))
}

function mediaPaths(entry: TimelineEntry): string[] {
  const media = [...(entry.media ?? []), ...(entry.images ?? [])]
  return media.flatMap((m) => {
    if ('src' in m) return [m.src]
    if ('video' in m) return [m.video, ...(m.poster ? [m.poster] : [])]
    return m.poster ? [m.poster] : []
  })
}

const RANK: Record<AuditLevel, number> = { error: 0, warn: 1, info: 2 }

export function auditContent(input: AuditInput): AuditFinding[] {
  const { repos, config, privateNames, timeline, icons, nowReviewed, publicFileExists, now } = input
  const findings: AuditFinding[] = []
  const add = (level: AuditLevel, kind: string, subject: string, message: string) =>
    findings.push({ level, kind, subject, message })

  const repoNames = new Set(repos.map((r) => r.name))
  const known = new Set([...repoNames, ...privateNames])
  const iconSet = new Set(icons)

  // ── References that point at nothing ─────────────────────────────────
  for (const name of config.featured) {
    if (!known.has(name)) add('error', 'unknown-featured', name, '`featured` names a repository that does not exist.')
  }
  for (const [name, o] of Object.entries(config.overrides)) {
    if (!repoNames.has(name)) add('warn', 'unknown-override', name, 'An override for a repository that is not in data/repos.json (renamed or deleted?).')
    if (o.reviewed !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(o.reviewed)) {
      add('error', 'bad-reviewed', name, `\`reviewed: '${o.reviewed}'\` should be YYYY-MM-DD.`)
    }
  }
  for (const entry of timeline) {
    if (entry.project && !known.has(entry.project)) {
      add('error', 'unknown-project', entry.id, `\`project: '${entry.project}'\` is not a known repository.`)
    }
    for (const name of entry.mentions ?? []) {
      if (!known.has(name)) add('error', 'unknown-project', entry.id, `\`mentions\` names '${name}', which is not a known repository.`)
    }
    for (const path of mediaPaths(entry)) {
      if (!publicFileExists(path)) add('error', 'missing-media', entry.id, `${path} is not in public/.`)
    }
  }

  // ── Claims of "right now" the calendar has overtaken ────────────────
  if (nowReviewed !== undefined) {
    const days = Math.floor((now.getTime() - periodStart(nowReviewed).getTime()) / DAY)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nowReviewed)) add('error', 'bad-reviewed', 'now.config.ts', `\`reviewed: '${nowReviewed}'\` should be YYYY-MM-DD.`)
    else if (days > NOW_REVIEW_DAYS) add('warn', 'now-list-stale', 'now.config.ts', `"Currently building" last checked ${nowReviewed} (${days} days) — check it and set \`reviewed\` to today.`)
  }

  // ── Timeline entries the calendar has overtaken ─────────────────────
  for (const entry of timeline) {
    if (!entry.date) continue
    if (entry.status === 'planned' && periodEnd(entry.date) <= now) {
      add('warn', 'planned-overdue', entry.id, `Planned for ${entry.date}, which has passed — move the date, or mark it 'now' or 'done'.`)
    }
    if (entry.status === 'now') {
      const days = Math.floor((now.getTime() - periodStart(entry.date).getTime()) / DAY)
      if (days > STALE_NOW_DAYS) {
        add('warn', 'now-stale', entry.id, `'now' since ${entry.date} (${days} days) — mark it 'done' or post what changed.`)
      }
    }
    if (entry.status === 'done' && periodStart(entry.date) > now) {
      add('warn', 'done-in-future', entry.id, `'done' with a date in the future (${entry.date}).`)
    }
  }

  // ── Projects ─────────────────────────────────────────────────────────
  for (const repo of repos) {
    if (!isVisible(repo, config)) continue
    const o = config.overrides[repo.name] ?? {}
    const title = o.title ?? repo.name

    const description = tidy(o.description ?? repo.description)
    if (description.length < THIN_DESCRIPTION) {
      add('warn', 'thin-description', repo.name, description
        ? `Description is only ${description.length} characters: "${description}".`
        : 'No description.')
    }
    if ((o.topics ?? repo.topics).length === 0) add('warn', 'no-topics', repo.name, 'No topics, so it lands in the fallback category and is hard to filter.')
    if (!iconSet.has(slug(repo.name))) add('info', 'no-icon', repo.name, 'No project icon.')

    const entries = timeline.filter((e) => e.date && e.status !== 'planned' && entryIsAbout(e, repo.name, title))
    if (entries.length === 0) add('info', 'no-timeline', repo.name, 'Never mentioned in the timeline.')

    // Measured from the newest entry, or from `reviewed` when that is later.
    const seen = [...entries.map((e) => periodEnd(e.date!)), ...(o.reviewed ? [periodEnd(o.reviewed)] : [])]
    const pushed = repo.pushed_at ? new Date(repo.pushed_at) : null
    if (!pushed || seen.length === 0) continue
    const newest = seen.reduce((a, b) => (a > b ? a : b))
    if (pushed.getTime() - newest.getTime() > ACTIVITY_GAP_DAYS * DAY) {
      const day = (d: Date) => d.toISOString().slice(0, 10)
      add('warn', 'activity-not-posted', repo.name, `Pushed ${day(pushed)}, last covered ${day(newest)} — post what changed, or set \`reviewed\`.`)
    }
  }

  return findings.sort((a, b) => RANK[a.level] - RANK[b.level] || a.kind.localeCompare(b.kind) || a.subject.localeCompare(b.subject))
}

/** The report as Markdown — readable in a terminal and in a GitHub job summary. */
export function formatAudit(findings: readonly AuditFinding[], now: Date): string {
  const count = (level: AuditLevel) => findings.filter((f) => f.level === level).length
  const lines = [
    `## Content audit — ${now.toISOString().slice(0, 10)}`,
    '',
    `${count('error')} errors · ${count('warn')} warnings · ${count('info')} gaps. How to fix each kind: CONTENT.md.`,
  ]
  const headings: Record<AuditLevel, string> = { error: 'Errors', warn: 'Out of date', info: 'Gaps' }
  for (const level of ['error', 'warn', 'info'] as const) {
    const group = findings.filter((f) => f.level === level)
    if (group.length === 0) continue
    lines.push('', `### ${headings[level]}`, '')
    for (const f of group) lines.push(`- \`${f.kind}\` **${f.subject}** — ${f.message}`)
  }
  return lines.join('\n') + '\n'
}
