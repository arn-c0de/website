import data from '@/data/commit-activity.json'

/** Commits across the public repositories in the week starting `week`. */
export interface CommitWeek {
  /** Sunday the week starts on, 'YYYY-MM-DD' (GitHub's week boundary). */
  week: string
  commits: number
}

/** Written by scripts/fetch-activity.mjs at build time; empty without it. */
export function commitWeeks(): CommitWeek[] {
  return (data as { weeks: CommitWeek[] }).weeks
}

/** The weeks starting on or after `since` (epoch ms). */
export function weeksSince(weeks: readonly CommitWeek[], since: number): CommitWeek[] {
  return weeks.filter((w) => Date.parse(w.week) >= since)
}

export function commitSummary(weeks: readonly CommitWeek[]): { total: number; perWeek: number; peak: number } {
  const total = weeks.reduce((sum, w) => sum + w.commits, 0)
  return {
    total,
    perWeek: weeks.length ? Math.round((total / weeks.length) * 10) / 10 : 0,
    peak: Math.max(0, ...weeks.map((w) => w.commits)),
  }
}
