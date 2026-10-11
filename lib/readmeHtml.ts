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

const DROP_WITH_CONTENT = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'noscript', 'template']
const DROP_TAG = ['link', 'meta', 'base']

export interface PreparedReadme {
  /** Images parked in data-src. */
  html: string
  images: number
}

export function prepareReadme(input: string, owner: string, repo: string): PreparedReadme {
  const RAW = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`
  const BLOB = `https://github.com/${owner}/${repo}/blob/HEAD/`
  const isAbsolute = (url: string) => /^(https?:|mailto:|#)/i.test(url)

  let html = input
  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, 'gi'), '')
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>`, 'gi'), '')
  }
  for (const tag of DROP_TAG) html = html.replace(new RegExp(`<${tag}\\b[^>]*>`, 'gi'), '')

  // GitHub's heading permalinks render as a stray glyph outside GitHub.
  html = html.replace(/<a\b[^>]*class="[^"]*\banchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
  html = html.replace(/<svg\b[^>]*class="[^"]*\bocticon-link\b[^"]*"[^>]*>[\s\S]*?<\/svg>/gi, '')

  // Event handlers, in any quoting.
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  html = html.replace(/\s+srcset\s*=\s*("[^"]*"|'[^']*')/gi, '')

  // URLs: drop executable schemes, resolve paths relative to the repository.
  html = html.replace(/\s(href|src)\s*=\s*"([^"]*)"/gi, (_, attr: string, value: string) => {
    const name = attr.toLowerCase()
    const scheme = value.replace(/&#?\w+;/g, '').replace(/[\u0000- ]+/g, '').toLowerCase()
    if (/^(javascript|vbscript|data):/.test(scheme)) return ''
    if (!isAbsolute(value) && value !== '') {
      const path = value.replace(/^\.?\//, '')
      value = (name === 'src' ? RAW : BLOB) + path
    }
    return ` ${name}="${value}"`
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
