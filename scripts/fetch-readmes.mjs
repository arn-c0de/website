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
 *
 * It also stores the repo's roadmap, milestones, features and changelog
 * files (see lib/repoDocs.ts) in data/docs/<repo>.json, which the project
 * page shows under the readme. Also not committed.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../projects.config.ts'
import { pageProjects } from '../lib/projectPages.ts'
import { prepareReadme } from '../lib/readmeHtml.ts'
import { docDir, pickDocs, trimDoc } from '../lib/repoDocs.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'data', 'readmes')
const docsDir = join(root, 'data', 'docs')
const owner = config.username

const headers = { Accept: 'application/vnd.github.html+json', 'User-Agent': 'arn-c0de-site' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const api = (path, accept = headers.Accept) =>
  fetch(`https://api.github.com/repos/${owner}/${path}`, {
    headers: { ...headers, Accept: accept },
    signal: AbortSignal.timeout(15_000),
  })

/** Roadmap, milestones, features and changelog of one repo, rendered by GitHub. */
async function fetchDocs(repo) {
  const explicit = config.overrides[repo]?.docs
  if (explicit === false) return []
  const tree = await api(`${repo}/git/trees/HEAD?recursive=1`, 'application/vnd.github+json')
  if (!tree.ok) return []
  const paths = ((await tree.json()).tree ?? []).filter((e) => e.type === 'blob').map((e) => e.path)
  const docs = []
  for (const pick of pickDocs(paths, explicit)) {
    const res = await api(`${repo}/contents/${pick.path.split('/').map(encodeURIComponent).join('/')}`)
    if (!res.ok) continue
    const { html, truncated } = trimDoc(await res.text())
    const prepared = prepareReadme(html, owner, repo, docDir(pick.path))
    // GitHub wraps every file in <div id="file">; several on one page would repeat the id.
    docs.push({ ...pick, ...prepared, html: prepared.html.replace(/ id="file"/g, ''), truncated })
  }
  return docs
}

async function main() {
  mkdirSync(dir, { recursive: true })
  mkdirSync(docsDir, { recursive: true })
  let saved = 0
  let docFiles = 0
  for (const project of pageProjects()) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${project.name}/readme`, {
        headers,
        signal: AbortSignal.timeout(15_000),
      })
      if (res.ok) {
        const readme = prepareReadme(await res.text(), owner, project.name)
        writeFileSync(join(dir, `${project.name}.json`), `${JSON.stringify(readme)}\n`)
        saved += 1
      } else if (res.status !== 404) {
        console.warn(`  ${project.name}: ${res.status}`)
      }
    } catch (error) {
      console.warn(`  ${project.name}: ${error.message}`)
    }
    try {
      const docs = await fetchDocs(project.name)
      if (docs.length) {
        writeFileSync(join(docsDir, `${project.name}.json`), `${JSON.stringify(docs)}\n`)
        docFiles += docs.length
      }
    } catch (error) {
      console.warn(`  ${project.name} docs: ${error.message}`)
    }
  }
  console.log(`readmes: ${saved} of ${pageProjects().length} saved, ${docFiles} roadmap/changelog files`)
}

main().catch((error) => console.warn(`readmes: skipped — ${error.message}`))
