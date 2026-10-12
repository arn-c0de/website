/**
 * The latest GitHub release of every project that has a page, for the
 * downloads section there: tag, date, files and the changelog, cleaned
 * like the readmes.
 *
 *   node --import ./scripts/test-setup.mjs scripts/fetch-releases.mjs
 *
 * The deploy workflow runs this with its GITHUB_TOKEN. It never fails the
 * build: without the API the committed file (empty) is used and the pages
 * simply show no downloads section.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../projects.config.ts'
import { pageProjects } from '../lib/projectPages.ts'
import { prepareReadme } from '../lib/readmeHtml.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'data', 'releases.json')
const owner = config.username

// The html+json media type adds body_html: GitHub's own rendering of the notes.
const headers = { Accept: 'application/vnd.github.html+json', 'User-Agent': 'arn-c0de-site' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function latest(repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(String(res.status))
  const r = await res.json()
  return {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    date: (r.published_at ?? r.created_at ?? '').slice(0, 10),
    url: r.html_url,
    prerelease: Boolean(r.prerelease),
    notes: r.body_html ? prepareReadme(r.body_html, owner, repo).html : '',
    assets: (r.assets ?? []).map((a) => ({
      name: a.name,
      size: a.size,
      url: a.browser_download_url,
      downloads: a.download_count,
    })),
  }
}

async function main() {
  const releases = {}
  let failed = 0
  for (const project of pageProjects()) {
    try {
      const release = await latest(project.name)
      if (release) releases[project.name] = release
    } catch (error) {
      failed += 1
      console.warn(`  ${project.name}: ${error.message}`)
    }
  }
  if (failed === pageProjects().length) {
    console.warn('releases: API unavailable — keeping the stored file')
    return
  }
  writeFileSync(file, `${JSON.stringify(releases, null, 2)}\n`)
  console.log(`releases: ${Object.keys(releases).length} of ${pageProjects().length} projects have one`)
}

main().catch((error) => console.warn(`releases: skipped — ${error.message}`))
