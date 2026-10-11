/**
 * Draws the social preview card — the image a link to this site unfurls into
 * on Discord, Mastodon, LinkedIn and the rest.
 *
 *   node --import ./scripts/test-setup.mjs scripts/generate-og.mjs
 *
 * Writes public/og.png (1200×630) and one card per project page to
 * public/og/<slug>.png; commit the results. The cards show nothing that goes
 * stale — no star counts — so they only need redrawing when a project's
 * title, description or icon changes, or a new one appears. It is a screenshot of a
 * small HTML card taken with a real browser, so it uses the site's own fonts
 * (Manrope, JetBrains Mono — bundled woff2, which the satori renderer behind
 * next/og cannot read) and the same palette as the dark theme.
 *
 * Needs a Chromium that playwright-core can launch: either the one from
 * `npx playwright install chromium`, or any binary named in CHROMIUM_PATH.
 * The card is a plain .png in public/ rather than an opengraph-image route on
 * purpose: a metadata route exports as an extensionless file, GitHub Pages
 * serves that as application/octet-stream, and unfurlers refuse it.
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pageProjects, projectSlug } from '../lib/projectPages.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'og.png')
// Inlined as data URIs: a page set from a string has no origin to load
// file:// URLs from.
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')}`
const avatar = `data:image/jpeg;base64,${readFileSync(join(root, 'public', 'avatar-large.jpg')).toString('base64')}`

const TOPICS = ['Embedded firmware', 'Local LLMs & RAG', 'Security tooling', 'Backends']

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const html = /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: JBM; font-weight: 100 800; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: Manrope, sans-serif; color: #ececec;
    background:
      #0e0f11;
  }
  .card { position: relative; height: 100%; padding: 72px 80px; display: flex; flex-direction: column; }
  .id { display: flex; align-items: center; gap: 20px; }
  .id img { width: 84px; height: 84px; border-radius: 50%; object-fit: cover;
    box-shadow: 0 0 0 4px #0e0f11, 0 0 0 5px #383b42; }
  .handle { font-size: 34px; font-weight: 780; letter-spacing: -0.02em; }
  .tagline { margin-top: 4px; font-size: 22px; font-weight: 600; color: #a5a8af; }
  h1 { margin-top: 56px; max-width: 1040px; text-wrap: balance; font-size: 78px; line-height: 1.06; font-weight: 790; letter-spacing: -0.04em; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .tags { display: flex; gap: 10px; }
  .tag { font-family: JBM, monospace; font-size: 19px; padding: 7px 14px; border-radius: 9px;
    background: #1c1e22; border: 1px solid #26282d; color: #a5a8af; }
  .url { font-size: 24px; font-weight: 650; color: #5cb5ec; white-space: nowrap; }
</style></head>
<body><div class="card">
  <div class="id"><img src="${avatar}" alt=""><div>
    <div class="handle">arn-c0de</div>
    <div class="tagline">Embedded systems, security tooling and local AI</div>
  </div></div>
  <h1>Software from firmware to app.</h1>
  <div class="foot">
    <div class="tags">${TOPICS.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
    <div class="url">arn-c0de.de</div>
  </div>
</div></body></html>`

/** A project's card: its icon and name lead, the site's handle sits above. */
function projectHtml(project) {
  const iconFile = project.icon ? join(root, 'public', project.icon.replace(/^\//, '')) : null
  const icon =
    iconFile && existsSync(iconFile)
      ? `<img class="picon" src="data:image/png;base64,${readFileSync(iconFile).toString('base64')}" alt="">`
      : `<div class="picon picon--mono">${escapeHtml(project.title.charAt(0))}</div>`
  const topics = project.topics.slice(0, 3)
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: JBM; font-weight: 100 800; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: Manrope, sans-serif; color: #ececec; background: #0e0f11; }
  .card { height: 100%; padding: 64px 80px; display: flex; flex-direction: column; }
  .by { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 700; color: #a5a8af; }
  .by img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .head { margin-top: 64px; display: flex; align-items: center; gap: 32px; }
  .picon { width: 112px; height: 112px; border-radius: 26px; object-fit: cover; flex: none; }
  .picon--mono { display: grid; place-items: center; background: #1c1e22; border: 2px solid #26282d; font-size: 56px; font-weight: 780; color: #a5a8af; }
  h1 { min-width: 0; overflow-wrap: anywhere; font-size: ${project.title.length > 16 ? 60 : 84}px; line-height: 1.02; font-weight: 790; letter-spacing: -0.04em; }
  .desc { margin-top: 32px; max-width: 1020px; font-size: 30px; line-height: 1.4; color: #a5a8af;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .tags { min-width: 0; overflow: hidden; white-space: nowrap; font-family: JBM, monospace; font-size: 21px; color: #878a91; }
  .tags span + span::before { content: '·'; margin: 0 12px; color: #383b42; }
  .url { font-size: 24px; font-weight: 650; color: #5cb5ec; white-space: nowrap; }
</style></head>
<body><div class="card">
  <div class="by"><img src="${avatar}" alt="">arn-c0de</div>
  <div class="head">${icon}<h1>${escapeHtml(project.title)}</h1></div>
  ${project.description ? `<p class="desc">${escapeHtml(project.description)}</p>` : ''}
  <div class="foot">
    <div class="tags">${[project.language, ...topics].filter(Boolean).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
    <div class="url">arn-c0de.de/projects/${escapeHtml(projectSlug(project))}</div>
  </div>
</div></body></html>`
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  const draw = async (markup, path) => {
    await page.setContent(markup, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path, type: 'png' })
  }
  await draw(html, out)
  console.log('public/og.png written')

  const dir = join(root, 'public', 'og')
  mkdirSync(dir, { recursive: true })
  const projects = pageProjects()
  for (const project of projects) await draw(projectHtml(project), join(dir, `${projectSlug(project)}.png`))
  console.log(`public/og/: ${projects.length} project cards written`)
} finally {
  await browser.close()
}
