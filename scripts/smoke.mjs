/**
 * Opens every page of the built site in a real browser and fails when one is
 * broken, so a bad push stops at the deploy instead of reaching the site.
 *
 *   node scripts/smoke.mjs            # after `npm run build` with PAGES_BASE_PATH=""
 *
 * Checks, per page, on a desktop and a phone viewport:
 *   - no uncaught script error and no console error (hydration mismatches
 *     land there), apart from failed requests to other hosts;
 *   - nothing from this site answers 4xx/5xx;
 *   - nothing sticks out past the viewport edge (cut off on a phone).
 * And once for the whole site: every internal link points at a page that
 * exists.
 *
 * Serves out/ itself, the way GitHub Pages does (index.html per directory,
 * 404.html for anything missing). Uses the Chromium named in CHROMIUM_PATH,
 * else the Chrome that GitHub's Ubuntu runners ship with.
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'out')
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

/** The file GitHub Pages would answer `pathname` with, or null for a 404. */
function resolveFile(pathname) {
  const path = normalize(join(root, decodeURIComponent(pathname)))
  if (!path.startsWith(root)) return null
  for (const candidate of [path, join(path, 'index.html'), `${path}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x')
  const file = resolveFile(pathname)
  if (!file) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] })
    res.end(existsSync(join(root, '404.html')) ? readFileSync(join(root, '404.html')) : 'not found')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

const TABS = ['', '?tab=projects', '?tab=timeline', '?tab=stack', '?tab=about', '?tab=contact']
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8')
const pages = [
  ...TABS.map((q) => `/${q}`),
  // Every prerendered page the sitemap lists beyond the tabs.
  ...[...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<?]+)<\/loc>/g)].map((m) => m[1]),
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]

const failures = []
const links = new Set()

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' },
)
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport })
    for (const path of [...new Set(pages)]) {
      const page = await context.newPage()
      const where = `${viewport.name} ${path}`
      page.on('pageerror', (error) => failures.push(`${where}: script error: ${error.message}`))
      page.on('console', (message) => {
        // A request that failed shows up twice: as a response below, and as
        // this console line. Other hosts (the GitHub API's rate limit) are
        // not this site's fault, and the response check covers our own.
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
          failures.push(`${where}: console error: ${message.text().slice(0, 300)}`)
        }
      })
      page.on('response', (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400) {
          failures.push(`${where}: ${response.status()} for ${response.url().slice(origin.length)}`)
        }
      })

      await page.goto(origin + path, { waitUntil: 'networkidle' })
      // Scroll through once so reveal-on-scroll content and lazy parts mount.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 30))
        }
      })

      // The page clips sideways overflow, so measure elements, not the page:
      // anything poking past the viewport edge that no scrolling or clipping
      // container of its own catches would be cut off.
      const sticking = await page.evaluate(() => {
        const out = []
        const caught = (el) => {
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) return true
          }
          return false
        }
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right <= window.innerWidth + 1 && r.left >= -1) continue
          const style = getComputedStyle(el)
          if (style.position === 'fixed' || style.visibility === 'hidden') continue
          if (caught(el)) continue
          out.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`)
        }
        return out
      })
      if (sticking.length) failures.push(`${where}: sticks out of the viewport: ${sticking.slice(0, 3).join(', ')}`)

      for (const href of await page.$$eval('a[href]', (as) => as.map((a) => a.href))) {
        if (href.startsWith(origin)) links.add(href.split('#')[0])
      }
      await page.close()
    }
    await context.close()
  }

  for (const href of links) {
    const { pathname } = new URL(href)
    if (!resolveFile(pathname)) failures.push(`broken link: ${pathname}`)
  }
} finally {
  await browser.close()
  server.close()
}

const checked = new Set(pages).size * VIEWPORTS.length
if (failures.length) {
  console.error(`smoke: ${failures.length} problem(s) across ${checked} page views\n`)
  for (const failure of [...new Set(failures)]) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`smoke: ${checked} page views and ${links.size} internal links fine`)
