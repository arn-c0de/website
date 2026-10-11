/**
 * Reading a YouTube channel without an API key: every channel publishes an
 * Atom feed of its latest uploads at
 * https://www.youtube.com/feeds/videos.xml?channel_id=UC…
 *
 * Pure functions only — `scripts/fetch-videos.mjs` does the fetching at build
 * time and the tests feed these a fixture.
 */

export interface FeedVideo {
  id: string
  title: string
  /** ISO timestamp of the upload. */
  published: string
  description: string
  /** The feed links Shorts as /shorts/…, ordinary uploads as /watch?v=… */
  short: boolean
}

/** One video as the site stores it in data/videos.json. */
export interface StoredVideo {
  id: string
  title: string
  /** 'YYYY-MM-DD' */
  date: string
  summary: string
  /** Local copy of the thumbnail under public/, or null when it could not be fetched. */
  poster: string | null
  short: boolean
}

export interface VideoData {
  channelId: string | null
  fetchedAt: string | null
  videos: StoredVideo[]
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

export function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : match
      }
      return ENTITIES[code] ?? match
    })
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))
  return m ? decodeXml(m[1]).trim() : null
}

export function parseFeed(xml: string): FeedVideo[] {
  const videos: FeedVideo[] = []
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = tag(entry, 'yt:videoId')
    const title = tag(entry, 'title')
    const published = tag(entry, 'published')
    if (!id || !title || !published) continue
    const link = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] ?? ''
    videos.push({
      id,
      title,
      published,
      description: tag(entry, 'media:description') ?? '',
      short: link.includes('/shorts/'),
    })
  }
  return videos
}

/** Finds the channel id on a channel page (the @handle URL). */
export function channelIdFromPage(html: string): string | null {
  const patterns = [
    /feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/,
    /"externalId":"(UC[\w-]{22})"/,
    /"channelId":"(UC[\w-]{22})"/,
    /youtube\.com\/channel\/(UC[\w-]{22})/,
  ]
  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) return m[1]
  }
  return null
}

/** Lines that are housekeeping rather than content. */
const NOISE = [
  /https?:\/\/|www\./i,
  /^\s*#\S/, // a line of hashtags
  /^\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?\s/, // chapter timestamps
  /\b(subscribe|abonnier|abo\b|like and|daumen hoch|patreon|discord|instagram|tiktok|twitter|follow me|folg mir|music by|musik:|credits?:|affiliate)/i,
  /^[\s\-–—_=*•·|]+$/,
]

/**
 * Turns a video description into one or two plain sentences: links,
 * hashtags, chapter lists and channel housekeeping are dropped, and the
 * rest is cut at a sentence boundary near `max` characters.
 */
export function summarize(description: string, max = 220): string {
  const kept = description
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !NOISE.some((re) => re.test(line)))
    .map((line) => line.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, '').trim())
    .filter((line) => /[\p{L}\p{N}]/u.test(line))

  const text = kept.join(' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''

  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text]
  let summary = ''
  let count = 0
  for (const raw of sentences) {
    const sentence = raw.trim()
    if (!sentence) continue
    const next = summary ? `${summary} ${sentence}` : sentence
    if (next.length > max) break
    summary = next
    if (++count === 2) break
  }
  if (summary) return summary

  // The first sentence alone is too long: cut at a word boundary.
  const cut = text.slice(0, max).replace(/\s+\S*$/, '')
  return `${cut.replace(/[,;:\-–—\s]+$/, '')}…`
}
