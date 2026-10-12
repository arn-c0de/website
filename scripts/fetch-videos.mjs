/**
 * Pulls the latest uploads of the YouTube channel named in timeline.config.ts
 * into data/videos.json, with a short summary of each description and a local
 * copy of each thumbnail in public/timeline/youtube/.
 *
 *   node scripts/fetch-videos.mjs
 *
 * The deploy workflow runs this before every build. It uses the channel's
 * public Atom feed, so there is no API key to manage. It never fails the
 * build: when YouTube cannot be reached, whatever data/videos.json already
 * holds is used as it is.
 *
 * Imports the TypeScript config and helpers directly — Node 22.18+ strips the
 * types itself.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { youtube } from '../timeline.config.ts'
import { channelIdFromPage, parseFeed, summarize } from '../lib/youtube-feed.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = join(root, 'data', 'videos.json')
const thumbDir = join(root, 'public', 'timeline', 'youtube')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; arn-c0de-site/1.0; +https://arn-c0de.de)',
  'Accept-Language': 'en',
  // Skips the EU consent interstitial that would otherwise replace the page.
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
}

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  return as === 'bytes' ? Buffer.from(await res.arrayBuffer()) : res.text()
}

function readExisting() {
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  } catch {
    return { channelId: null, fetchedAt: null, videos: [] }
  }
}

async function resolveChannelId(existing) {
  if (youtube.channelId) return youtube.channelId
  const handle = youtube.handle.replace(/^@?/, '@')
  try {
    const id = channelIdFromPage(await get(`https://www.youtube.com/${handle}`))
    if (id) return id
  } catch (error) {
    console.warn(`  could not open ${handle}: ${error.message}`)
  }
  return existing.channelId
}

/**
 * The largest thumbnail YouTube has for the video; not every size exists.
 * WebP first — about half the bytes of the JPEG — and the JPEG if YouTube
 * has no WebP for it.
 */
async function saveThumbnail(id) {
  for (const ext of ['webp', 'jpg']) {
    if (existsSync(join(thumbDir, `${id}.${ext}`))) return `/timeline/youtube/${id}.${ext}`
  }
  const sources = ['maxresdefault', 'sddefault', 'hqdefault'].flatMap((size) => [
    { url: `https://i.ytimg.com/vi_webp/${id}/${size}.webp`, ext: 'webp' },
    { url: `https://i.ytimg.com/vi/${id}/${size}.jpg`, ext: 'jpg' },
  ])
  for (const { url, ext } of sources) {
    try {
      const bytes = await get(url, 'bytes')
      // YouTube answers a missing size with a 120px grey placeholder.
      if (bytes.length < 2_000) continue
      writeFileSync(join(thumbDir, `${id}.${ext}`), bytes)
      return `/timeline/youtube/${id}.${ext}`
    } catch {
      /* try the next source */
    }
  }
  return null
}

async function main() {
  const existing = readExisting()
  const channelId = await resolveChannelId(existing)
  if (!channelId) {
    console.warn(`videos: no channel id for ${youtube.handle} — keeping ${existing.videos.length} stored video(s)`)
    return
  }

  let feed
  try {
    feed = parseFeed(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`))
  } catch (error) {
    console.warn(`videos: feed unavailable (${error.message}) — keeping ${existing.videos.length} stored video(s)`)
    return
  }

  mkdirSync(thumbDir, { recursive: true })
  const videos = []
  for (const v of feed) {
    videos.push({
      id: v.id,
      title: v.title,
      // Minute precision: two uploads on one day still come out in order.
      date: v.published.slice(0, 16),
      summary: summarize(v.description),
      poster: await saveThumbnail(v.id),
      short: v.short,
    })
  }
  videos.sort((a, b) => (a.date < b.date ? 1 : -1))

  writeFileSync(
    dataFile,
    `${JSON.stringify({ channelId, fetchedAt: new Date().toISOString(), videos }, null, 2)}\n`,
  )
  console.log(`videos: ${videos.length} from ${youtube.handle} (${channelId})`)
}

main().catch((error) => {
  // Anything unexpected still must not take the deploy down with it.
  console.warn(`videos: skipped — ${error.message}`)
})
