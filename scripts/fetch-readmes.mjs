/**
 * Fetches the readme of every project that has a page and stores it, cleaned
 * and with images parked, in data/readmes/<repo>.json. The project pages are
 * prerendered with it, so the text is in the HTML that search engines read
 * instead of arriving only after the page has loaded.
 *
 *   node --import ./scripts/test-setup.mjs scripts/fetch-readmes.mjs
 *
 * The deploy workflow runs this before the build with its GITHUB_TOKEN, which
 * lifts the API limit from 60 to 1,000 requests an hour. It never fails the
 * build: a readme that cannot be fetched is simply left out, and that page
 * loads it in the browser as before. data/readmes/ is not committed.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../projects.config.ts'
import { pageProjects } from '../lib/projectPages.ts'
import { prepareReadme } from '../lib/readmeHtml.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'data', 'readmes')
const owner = config.username

const headers = { Accept: 'application/vnd.github.html+json', 'User-Agent': 'arn-c0de-site' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function main() {
  mkdirSync(dir, { recursive: true })
  let saved = 0
  for (const project of pageProjects()) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${project.name}/readme`, {
        headers,
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) {
        if (res.status !== 404) console.warn(`  ${project.name}: ${res.status}`)
        continue
      }
      const readme = prepareReadme(await res.text(), owner, project.name)
      writeFileSync(join(dir, `${project.name}.json`), `${JSON.stringify(readme)}\n`)
      saved += 1
    } catch (error) {
      console.warn(`  ${project.name}: ${error.message}`)
    }
  }
  console.log(`readmes: ${saved} of ${pageProjects().length} saved`)
}

main().catch((error) => console.warn(`readmes: skipped — ${error.message}`))
