/**
 * Sums the weekly commit counts of every public repository over the last
 * year into data/commit-activity.json, for the stack tab's commit chart.
 *
 *   node --import ./scripts/test-setup.mjs scripts/fetch-activity.mjs
 *
 * Uses GitHub's /stats/commit_activity, which answers 202 while it computes
 * the numbers for a repository it has not counted lately; those are asked
 * again a few times and left out if they never arrive. The deploy workflow
 * runs this with its GITHUB_TOKEN. It never fails the build: without the
 * API, the committed file (empty) is used and the chart stays hidden.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../projects.config.ts'
import { pageProjects } from '../lib/projectPages.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'data', 'commit-activity.json')

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'arn-c0de-site' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** The repository's 52 weeks, or null when GitHub has no numbers for it. */
async function weeksOf(repo) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.github.com/repos/${config.username}/${repo}/stats/commit_activity`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 202) {
      await wait(2_000 * (attempt + 1))
      continue
    }
    if (!res.ok) throw new Error(String(res.status))
    const body = await res.json()
    return Array.isArray(body) ? body : null
  }
  return null
}

async function main() {
  const totals = new Map()
  let counted = 0
  const repos = pageProjects().map((p) => p.name)
  // Ask for all of them first: a 202 starts GitHub's computation, so the
  // retries below find most of them ready.
  const results = await Promise.allSettled(repos.map((repo) => weeksOf(repo)))
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`  ${repos[i]}: ${result.reason.message}`)
      return
    }
    if (!result.value) return
    counted += 1
    for (const { week, total } of result.value) totals.set(week, (totals.get(week) ?? 0) + total)
  })

  if (counted === 0) {
    console.warn('activity: no repository answered — keeping the stored file')
    return
  }
  const weeks = [...totals.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, commits]) => ({ week: new Date(week * 1000).toISOString().slice(0, 10), commits }))
  writeFileSync(file, `${JSON.stringify({ fetchedAt: new Date().toISOString(), repos: counted, weeks }, null, 2)}\n`)
  console.log(`activity: ${weeks.length} weeks from ${counted} of ${repos.length} repositories`)
}

main().catch((error) => console.warn(`activity: skipped — ${error.message}`))
