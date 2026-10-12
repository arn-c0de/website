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
 *
 * Timeline posts get a card each too, in English and German, at
 * public/og/posts/<id>.<locale>.jpg. Those are not committed: the deploy
 * draws them after fetching the channel's videos (`--posts` draws only
 * those), so a new video's post has its card on the first deploy.
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { snapshotProjects } from '../lib/github.ts'
import { pageProjects, projectSlug } from '../lib/projectPages.ts'
import { allTimelineEntries, entryHasPage, entryVisual, formatTimelineDate, pick } from '../lib/timeline.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'og.png')
// Inlined as data URIs: a page set from a string has no origin to load
// file:// URLs from.
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')}`
const avatar = `data:image/jpeg;base64,${readFileSync(join(root, 'public', 'avatar-large.jpg')).toString('base64')}`

const TOPICS = ['Web apps', 'Backends & APIs', 'Embedded firmware', 'Local AI']

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const html = /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: Fraunces; font-weight: 100 900; src: url('${font('fraunces', 'fraunces-latin-wght-normal.woff2')}') format('woff2'); }
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
  h1 { font-family: Fraunces, Georgia, serif; margin-top: 56px; max-width: 1040px; text-wrap: balance; font-size: 78px; line-height: 1.06; font-weight: 790; letter-spacing: -0.04em; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .tags { display: flex; gap: 10px; }
  .tag { font-family: JBM, monospace; font-size: 19px; padding: 7px 14px; border-radius: 9px;
    background: #1c1e22; border: 1px solid #26282d; color: #a5a8af; }
  .url { font-size: 24px; font-weight: 650; color: #ec8a5c; white-space: nowrap; }
</style></head>
<body><div class="card">
  <div class="id"><img src="${avatar}" alt=""><div>
    <div class="handle">arn-c0de</div>
    <div class="tagline">Web apps, backends, embedded systems and local AI</div>
  </div></div>
  <h1>Web apps, backends and everything below.</h1>
  <div class="foot">
    <div class="tags">${TOPICS.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
    <div class="url">arn-c0de.de</div>
  </div>
</div></body></html>`

const dataUri = (file) => {
  const ext = file.split('.').pop().toLowerCase()
  const type = ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext
  return `data:image/${type};base64,${readFileSync(file).toString('base64')}`
}

const STATUS = {
  done: { en: 'Done', de: 'Fertig', color: '#5cc28e' },
  now: { en: 'In progress', de: 'In Arbeit', color: '#ec8a5c' },
  planned: { en: 'Planned', de: 'Geplant', color: '#878a91' },
}

/**
 * A timeline post's card: status and date, the title, the first lines of the
 * text, the project at the foot, and the post's picture on the right when it
 * has one (never the still of an 18+ video).
 */
function postHtml(entry, project, locale) {
  const visual = entryVisual(entry)
  const pictureFile = visual && !visual.sensitive ? join(root, 'public', visual.src.replace(/^\//, '')) : null
  const picture = pictureFile && existsSync(pictureFile) ? dataUri(pictureFile) : null
  // Logos and artwork are marked fit: 'contain' and are shown whole.
  const contain = [...(entry.media ?? []), ...(entry.images ?? [])].find((m) => m.src === visual?.src)?.fit === 'contain'
  const iconPath = project?.iconDark ?? project?.icon
  const iconFile = iconPath ? join(root, 'public', iconPath.replace(/^\//, '')) : null
  const icon = iconFile && existsSync(iconFile) ? `<img class="picon" src="${dataUri(iconFile)}" alt="">` : ''
  const status = STATUS[entry.status]
  const when = entry.when ? pick(entry.when, locale) : entry.date ? formatTimelineDate(entry.date, locale) : ''
  const title = pick(entry.title, locale)
  const path = `${locale === 'de' ? '/de' : ''}/timeline/${entry.id}`
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: Fraunces; font-weight: 100 900; src: url('${font('fraunces', 'fraunces-latin-wght-normal.woff2')}') format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: Manrope, sans-serif; color: #ececec; background: #0e0f11; display: flex; }
  .card { flex: 1; min-width: 0; height: 100%; padding: 60px ${picture ? 56 : 80}px 60px 80px; display: flex; flex-direction: column; }
  .by { display: flex; align-items: center; gap: 14px; font-size: 22px; font-weight: 700; color: #a5a8af; }
  .by img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
  .meta { margin-top: 44px; display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 650; color: #a5a8af; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: ${status.color}; }
  h1 { font-family: Fraunces, Georgia, serif; margin-top: 18px; text-wrap: balance; overflow-wrap: anywhere;
    font-size: ${title.length > 60 ? 50 : title.length > 36 ? 58 : 68}px; line-height: 1.08; font-weight: 790; letter-spacing: -0.035em;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .text { margin-top: 22px; font-size: 25px; line-height: 1.45; color: #a5a8af;
    display: -webkit-box; -webkit-line-clamp: ${picture ? 3 : 2}; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .project { display: flex; align-items: center; gap: 14px; min-width: 0; font-size: 24px; font-weight: 700; white-space: nowrap; overflow: hidden; }
  .picon { width: 44px; height: 44px; border-radius: 11px; object-fit: contain; flex: none; }
  .url { font-size: 21px; font-weight: 650; color: #ec8a5c; white-space: nowrap; }
  .pic { width: 430px; height: 100%; flex: none; object-fit: ${contain ? 'contain' : 'cover'}; ${contain ? 'padding: 48px; background: #16181b;' : ''} }
</style></head>
<body><div class="card">
  <div class="by"><img src="${avatar}" alt="">arn-c0de · ${locale === 'de' ? 'Zeitstrahl' : 'Timeline'}</div>
  <div class="meta"><span class="dot"></span>${escapeHtml(status[locale])}${when ? ` · ${escapeHtml(when)}` : ''}</div>
  <h1>${escapeHtml(title)}</h1>
  <p class="text">${escapeHtml(pick(entry.text, locale))}</p>
  <div class="foot">
    <div class="project">${project ? `${icon}${escapeHtml(project.title)}` : ''}</div>
    ${picture ? '' : `<div class="url">arn-c0de.de${escapeHtml(path)}</div>`}
  </div>
</div>${picture ? `<img class="pic" src="${picture}" alt="">` : ''}</body></html>`
}

/** A project's card: its icon and name lead, the site's handle sits above. */
function projectHtml(project) {
  const iconFile = project.icon ? join(root, 'public', project.icon.replace(/^\//, '')) : null
  const icon =
    iconFile && existsSync(iconFile)
      ? `<img class="picon" src="data:image/${iconFile.endsWith('.svg') ? 'svg+xml' : iconFile.split('.').pop()};base64,${readFileSync(iconFile).toString('base64')}" alt="">`
      : `<div class="picon picon--mono">${escapeHtml(project.title.charAt(0))}</div>`
  const topics = project.topics.slice(0, 3)
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: Fraunces; font-weight: 100 900; src: url('${font('fraunces', 'fraunces-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: JBM; font-weight: 100 800; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: Manrope, sans-serif; color: #ececec; background: #0e0f11; }
  .card { height: 100%; padding: 64px 80px; display: flex; flex-direction: column; }
  .by { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 700; color: #a5a8af; }
  .by img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .head { margin-top: 64px; display: flex; align-items: center; gap: 32px; }
  .picon { width: 112px; height: 112px; border-radius: 26px; object-fit: cover; flex: none; }
  .picon--mono { display: grid; place-items: center; background: #1c1e22; border: 2px solid #26282d; font-size: 56px; font-weight: 780; color: #a5a8af; }
  h1 { font-family: Fraunces, Georgia, serif; min-width: 0; overflow-wrap: anywhere; font-size: ${project.title.length > 16 ? 60 : 84}px; line-height: 1.02; font-weight: 790; letter-spacing: -0.04em; }
  .desc { margin-top: 32px; max-width: 1020px; font-size: 30px; line-height: 1.4; color: #a5a8af;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .tags { min-width: 0; overflow: hidden; white-space: nowrap; font-family: JBM, monospace; font-size: 21px; color: #878a91; }
  .tags span + span::before { content: '·'; margin: 0 12px; color: #383b42; }
  .url { font-size: 24px; font-weight: 650; color: #ec8a5c; white-space: nowrap; }
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

const onlyPosts = process.argv.includes('--posts')

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : process.env.CI
      ? { channel: 'chrome' }
      : {},
)
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  const draw = async (markup, path) => {
    await page.setContent(markup, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot(path.endsWith('.jpg') ? { path, type: 'jpeg', quality: 86 } : { path, type: 'png' })
  }
  const dir = join(root, 'public', 'og')
  mkdirSync(join(dir, 'posts'), { recursive: true })

  if (!onlyPosts) {
    await draw(html, out)
    console.log('public/og.png written')
    const projects = pageProjects()
    for (const project of projects) await draw(projectHtml(project), join(dir, `${projectSlug(project)}.png`))
    console.log(`public/og/: ${projects.length} project cards written`)
  }

  const all = snapshotProjects()
  const posts = allTimelineEntries(all).filter(entryHasPage)
  for (const entry of posts) {
    const project = entry.project ? all.find((p) => p.name === entry.project) : undefined
    for (const locale of ['en', 'de']) {
      await draw(postHtml(entry, project, locale), join(dir, 'posts', `${entry.id}.${locale}.jpg`))
    }
  }
  console.log(`public/og/posts/: ${posts.length * 2} post cards written`)
} finally {
  await browser.close()
}
