/**
 * Accepts whatever a YouTube link looks like when it is copied — a watch URL,
 * a youtu.be short link, a Shorts or embed URL, or the bare 11-character id —
 * and returns the id, or null when it is none of those.
 */
export function youtubeId(input: string): string | null {
  const value = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  let id: string | null = null
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v')
    const path = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)
    if (!id && path) id = path[1]
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

/** "1m30s", "90s", "90" → 90; whatever the link's t= or start= said. */
export function youtubeStart(input: string): number {
  try {
    const url = new URL(input.trim())
    const raw = url.searchParams.get('t') ?? url.searchParams.get('start')
    if (!raw) return 0
    if (/^\d+$/.test(raw)) return Number(raw)
    const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0
  } catch {
    return 0
  }
}

/** The privacy-enhanced embed: no cookies until the visitor plays it. */
export function youtubeEmbedUrl(id: string, start = 0): string {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' })
  if (start > 0) params.set('start', String(start))
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

export function youtubeWatchUrl(id: string, start = 0): string {
  return `https://www.youtube.com/watch?v=${id}${start > 0 ? `&t=${start}s` : ''}`
}
