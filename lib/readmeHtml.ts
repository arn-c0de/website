/**
 * Build-time counterpart of the readme sanitising in components/Readme.tsx,
 * for HTML that is baked into the project pages. Node has no DOM, so this is
 * a small allowlist sanitiser of its own. The input is GitHub's rendering,
 * which GitHub has already sanitised; this is the second line, and it is
 * written so it does not depend on the first.
 *
 * How it stays safe without a DOM: the markup is read once, left to right,
 * and the output is built from scratch. Every tag is either rebuilt from the
 * allowed tag and attribute names, or dropped; every `<` that does not open
 * such a tag is written out as `&lt;`. Nothing is deleted from the input and
 * the remains glued together, so no removal can assemble a new tag out of
 * the text on either side of it.
 *
 * Images come out parked in `data-src`, as on the client, so a project page
 * contacts no third party until the visitor asks for the pictures.
 */

/** Tags kept, with only the global and their own attributes below. */
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'article', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'details', 'div',
  'dl', 'dt', 'em', 'figcaption', 'figure', 'g-emoji', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'img', 'input', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'samp', 'section', 'small',
  'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'tr', 'tt', 'u', 'ul', 'var',
])
/** Tags dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'noscript',
  'template', 'svg', 'math', 'textarea', 'select', 'title',
])
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input'])
const GLOBAL_ATTRS = new Set(['id', 'class', 'title', 'dir', 'lang', 'align', 'aria-hidden', 'aria-label'])
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'name']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start', 'type']),
  details: new Set(['open']),
  input: new Set(['type', 'checked', 'disabled']),
  'g-emoji': new Set(['alias']),
}
/** The only schemes a readme URL may use; anything else drops the attribute. */
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
  const plain = decodeEntities(value).replace(/[\u0000- \u007f-\u009f]+/g, '')
  const match = plain.match(/^([a-z][a-z0-9+.-]*):/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * A URL without a scheme, resolved the way it would be on GitHub: `/owner/…`
 * against github.com, anything else against the repository. Anchors stay.
 */
export function resolvePath(value: string, base: string): string {
  if (value === '' || value.startsWith('#')) return value
  // Protocol-relative URLs would leave for another host; keep them on GitHub.
  if (value.startsWith('//')) return base + value.replace(/^\/+/, '')
  if (value.startsWith('/')) return `https://github.com${value}`
  return base + value.replace(/^\.\//, '')
}

/** An attribute value made safe to sit between double quotes. */
const quoteAttr = (value: string) =>
  value.replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** One opening tag: name, attributes (any quoting), optional self-closing slash. */
const OPEN_TAG = /^<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/
const CLOSE_TAG = /^<\/([a-zA-Z][\w-]*)\s*>/
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

/**
 * `dir` is the folder the markdown file sits in (e.g. 'docs/'), so relative
 * links in a file below the root resolve the way they do on GitHub.
 */
export function prepareReadme(input: string, owner: string, repo: string, dir = ''): PreparedReadme {
  const RAW = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${dir}`
  const BLOB = `https://github.com/${owner}/${repo}/blob/HEAD/${dir}`
  let images = 0
  let out = ''
  let i = 0

  /** Everything up to and including the tag that closes `name`, skipped. */
  const skipPast = (name: string) => {
    const close = new RegExp(`</${name}\\s*>`, 'ig')
    close.lastIndex = i
    const found = close.exec(input)
    i = found ? found.index + found[0].length : input.length
  }

  const rebuild = (name: string, rawAttrs: string): string => {
    const allowed = TAG_ATTRS[name]
    const attrs: string[] = []
    for (const m of rawAttrs.matchAll(ATTR)) {
      const attr = m[1].toLowerCase()
      if (!GLOBAL_ATTRS.has(attr) && !allowed?.has(attr)) continue
      let value = m[2] ?? m[3] ?? m[4] ?? ''
      if (attr === 'href' || attr === 'src') {
        const scheme = schemeOf(value)
        if (scheme !== null && !SAFE_SCHEMES.has(scheme)) continue
        if (scheme === null) value = resolvePath(value, attr === 'src' ? RAW : BLOB)
        // Parked: an image only loads once the visitor asks for it.
        if (name === 'img' && attr === 'src') {
          attrs.push(`data-src="${quoteAttr(value)}"`)
          continue
        }
      }
      if (name === 'input' && attr === 'type' && value.toLowerCase() !== 'checkbox') return ''
      attrs.push(m[2] === undefined && m[3] === undefined && m[4] === undefined ? attr : `${attr}="${quoteAttr(value)}"`)
    }
    if (name === 'a') attrs.push('target="_blank"', 'rel="noopener noreferrer"')
    if (name === 'img') {
      images += 1
      attrs.push('loading="lazy"')
    }
    if (name === 'input' && !attrs.some((a) => a.startsWith('disabled'))) attrs.push('disabled')
    return `<${name}${attrs.length ? ` ${[...new Set(attrs)].join(' ')}` : ''}>`
  }

  while (i < input.length) {
    const lt = input.indexOf('<', i)
    if (lt === -1) {
      out += input.slice(i)
      break
    }
    out += input.slice(i, lt)
    i = lt
    const rest = input.slice(i)

    if (rest.startsWith('<!--')) {
      const end = input.indexOf('-->', i + 4)
      i = end === -1 ? input.length : end + 3
      continue
    }

    const close = rest.match(CLOSE_TAG)
    if (close) {
      const name = close[1].toLowerCase()
      if (ALLOWED_TAGS.has(name) && !VOID_TAGS.has(name)) out += `</${name}>`
      i += close[0].length
      continue
    }

    const open = rest.match(OPEN_TAG)
    if (open) {
      const name = open[1].toLowerCase()
      i += open[0].length
      if (DROP_WITH_CONTENT.has(name)) {
        skipPast(name)
      } else if (name === 'a' && /\sclass\s*=\s*["']?[^"'>]*\banchor\b/i.test(open[2])) {
        // GitHub's heading permalinks render as a stray glyph outside GitHub.
        skipPast('a')
      } else if (ALLOWED_TAGS.has(name)) {
        out += rebuild(name, open[2])
      }
      continue
    }

    // A `<` that opens nothing we keep is text.
    out += '&lt;'
    i += 1
  }

  return { html: balanceHtml(out), images }
}

/**
 * Closes what is left open and drops closing tags that close nothing, for
 * markup this module built (every tag rebuilt, so the scan stays simple).
 * The HTML is set as innerHTML into the page; an open <div> at its end would
 * swallow the elements after it, and React's hydration would then find a
 * different page than it rendered.
 */
export function balanceHtml(html: string): string {
  const open: string[] = []
  const out = html.replace(/<(\/?)([a-z][\w-]*)([^>]*)>/gi, (tag, slash: string, rawName: string) => {
    const name = rawName.toLowerCase()
    if (VOID_TAGS.has(name)) return tag
    if (!slash) {
      open.push(name)
      return tag
    }
    const at = open.lastIndexOf(name)
    if (at === -1) return ''
    const closing = open.splice(at).reverse()
    return closing.map((n) => `</${n}>`).join('')
  })
  return out + open.reverse().map((n) => `</${n}>`).join('')
}

/** The same markup with the parked images switched back on. */
export function unparkImages(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (tag) => tag.replace(/\sdata-src="/i, ' src="'))
}
