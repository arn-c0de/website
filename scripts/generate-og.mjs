/**
 * Draws the social preview card — the image a link to this site unfurls into
 * on Discord, Mastodon, LinkedIn and the rest.
 *
 *   node scripts/generate-og.mjs
 *
 * Writes public/og.png (1200×630); commit the result. It is a screenshot of a
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
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'og.png')
// Inlined as data URIs: a page set from a string has no origin to load
// file:// URLs from.
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')}`
const avatar = `data:image/jpeg;base64,${readFileSync(join(root, 'public', 'avatar-large.jpg')).toString('base64')}`

const TOPICS = ['Embedded firmware', 'Local LLMs & RAG', 'Security tooling', 'Backends']

const html = /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Manrope; font-weight: 200 800; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: JBM; font-weight: 100 800; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: Manrope, sans-serif; color: #eef1f6;
    background:
      radial-gradient(700px 420px at 8% -10%, rgba(134, 163, 255, 0.22), transparent 70%),
      radial-gradient(600px 380px at 100% 0%, rgba(95, 128, 234, 0.16), transparent 70%),
      #0b0e14;
  }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(160,175,255,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(160,175,255,.06) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 90% at 30% 0%, #000 10%, transparent 75%);
  }
  .card { position: relative; height: 100%; padding: 72px 80px; display: flex; flex-direction: column; }
  .id { display: flex; align-items: center; gap: 20px; }
  .id img { width: 84px; height: 84px; border-radius: 50%; object-fit: cover;
    box-shadow: 0 0 0 4px #0b0e14, 0 0 0 5px #333c4c; }
  .handle { font-size: 34px; font-weight: 780; letter-spacing: -0.02em; }
  .tagline { margin-top: 4px; font-size: 22px; font-weight: 600; color: #a6afc0; }
  h1 { margin-top: 56px; max-width: 1040px; text-wrap: balance; font-size: 78px; line-height: 1.06; font-weight: 790; letter-spacing: -0.04em; }
  .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .tags { display: flex; gap: 10px; }
  .tag { font-family: JBM, monospace; font-size: 19px; padding: 7px 14px; border-radius: 9px;
    background: #171c26; border: 1px solid #222936; color: #a6afc0; }
  .url { font-size: 24px; font-weight: 650; color: #86a3ff; white-space: nowrap; }
</style></head>
<body><div class="grid"></div><div class="card">
  <div class="id"><img src="${avatar}" alt=""><div>
    <div class="handle">arn-c0de</div>
    <div class="tagline">Embedded systems, security tooling and local AI</div>
  </div></div>
  <h1>Software from firmware to app.</h1>
  <div class="foot">
    <div class="tags">${TOPICS.map((t) => `<span class="tag">${t.replace('&', '&amp;')}</span>`).join('')}</div>
    <div class="url">arn-c0de.de</div>
  </div>
</div></body></html>`

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: out, type: 'png' })
} finally {
  await browser.close()
}
console.log(`public/og.png written`)
