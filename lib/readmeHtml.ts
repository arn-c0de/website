/**
 * Build-time counterpart of the readme sanitising in components/Readme.tsx,
 * for HTML that is baked into the project pages. Node has no DOM, so this
 * works on the markup as text — acceptable here because the input is
 * GitHub's own rendering, which GitHub has already sanitised; this is a
 * second line, not the first.
 *
 * Images come out parked in `data-src`, as on the client, so a project page
 * contacts no third party until the visitor asks for the pictures.
 */

const DROP_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'noscript',
  'template',
]
const DROP_TAG = ['link', 'meta', 'base']
/** Attributes that carry a URL a browser may follow or load. */
const URL_ATTRS = /\s((?:xlink:)?href|src|action|formaction|poster|background|data)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi
/** The only schemes a readme link may use; anything else is dropped. */
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto'])

export interface PreparedReadme {
  /** Images parked in data-src. */
  html: string
  images: number
}

const NAMED: Record<string, string> = { colon: ':', tab: '\t', newline: '\n', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }

/** Character references as a browser resolves them in an attribute value. */
function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (match, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    }
    return NAMED[ref.toLowerCase()] ?? match
  })
}

/**
 * The scheme a browser would act on, or null for a relative URL. Browsers
 * drop whitespace and control characters inside a scheme (`java\tscript:`
 * still runs), so those go before looking.
 */
function schemeOf(value: string): string | null {
  const plain = decodeEntities(value).replace(/[\u0000-\u0020\u007f-\u009f]+/g, '')
  const match = plain.match(/^([a-z][a-z0-9+.-]*):/i)
  return match ? match[1].toLowerCase() : null
}

/** Applies `step` until the text stops changing, so removals cannot nest. */
function untilStable(text: string, step: (text: string) => string): string {
  for (let i = 0; i < 50; i++) {
    const next = step(text)
    if (next === text) return text
    text = next
  }
  // Still changing after fifty passes: nothing legitimate looks like that.
  return ''
}

export function prepareReadme(input: string, owner: string, repo: string): PreparedReadme {
  const RAW = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`
  const BLOB = `https://github.com/${owner}/${repo}/blob/HEAD/`

  // Removing one tag can join the text around it into another
  // (`<scr<script></script>ipt>`), so every removal repeats until nothing
  // more matches.
  let html = untilStable(input, (text) => {
    for (const tag of DROP_WITH_CONTENT) {
      text = text.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, 'gi'), '')
      text = text.replace(new RegExp(`<${tag}\\b[^>]*>?`, 'gi'), '')
    }
    for (const tag of DROP_TAG) text = text.replace(new RegExp(`<${tag}\\b[^>]*>?`, 'gi'), '')
    // Event handlers, in any quoting.
    return text.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  })

  // GitHub's heading permalinks render as a stray glyph outside GitHub.
  html = html.replace(/<a\b[^>]*class="[^"]*\banchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
  html = html.replace(/<svg\b[^>]*class="[^"]*\bocticon-link\b[^"]*"[^>]*>[\s\S]*?<\/svg>/gi, '')
  html = html.replace(/\s+srcset\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')

  // URLs, in any quoting: only http(s), mailto, anchors and relative paths
  // survive, and relative paths are resolved against the repository.
  html = html.replace(URL_ATTRS, (_, attr: string, _q, double?: string, single?: string, bare?: string) => {
    const name = attr.toLowerCase()
    let value = double ?? single ?? bare ?? ''
    const scheme = schemeOf(value)
    if (scheme !== null && !SAFE_SCHEMES.has(scheme)) return ''
    if (scheme === null && value !== '' && !value.startsWith('#')) {
      const path = value.replace(/^\.?\//, '')
      value = (name === 'src' ? RAW : BLOB) + path
    }
    return ` ${name}="${value.replace(/"/g, '&quot;')}"`
  })

  // Links leave the site in a new tab and carry no referrer.
  html = html.replace(/<a\b([^>]*)>/gi, (_, attrs: string) => {
    const cleaned = attrs.replace(/\s(target|rel)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    return `<a${cleaned} target="_blank" rel="noopener noreferrer">`
  })

  let images = 0
  html = html.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => {
    images += 1
    const parked = attrs.replace(/\ssrc="/i, ' data-src="')
    return `<img${parked.replace(/\s*\/$/, '')} loading="lazy">`
  })

  return { html, images }
}

/** The same markup with the parked images switched back on. */
export function unparkImages(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (tag) => tag.replace(/\sdata-src="/i, ' src="'))
}
