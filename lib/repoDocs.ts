/**
 * Markdown files from a repository that its project page shows under the
 * readme: roadmap, milestones, features and changelog. They are found by name
 * in the repo's file tree, so a repo that adds a ROADMAP.md gets a roadmap
 * section on its page at the next deploy without anything changing here.
 *
 * scripts/fetch-readmes.mjs picks the files with `pickDocs`, lets GitHub
 * render them, cleans them like the readme and stores them in
 * data/docs/<repo>.json; the project page is prerendered with them.
 */
import { balanceHtml, type PreparedReadme } from './readmeHtml'

export type DocKind = 'roadmap' | 'milestones' | 'features' | 'changelog' | 'doc'

/** In page order. A file's name (without .md) decides its kind. */
const KINDS: { kind: Exclude<DocKind, 'doc'>; match: RegExp }[] = [
  { kind: 'roadmap', match: /^roadmap$/i },
  { kind: 'milestones', match: /^milestones?$/i },
  { kind: 'features', match: /^features$/i },
  { kind: 'changelog', match: /^(changelog|changes|history)$/i },
]

/** Folders whose markdown is never the project's own story. */
const SKIP = /(^|\/)(\.github|node_modules|vendor|third[_-]?party|external|deps)\//i

export interface DocPick {
  kind: DocKind
  path: string
}

export interface RepoDoc extends PreparedReadme, DocPick {
  /** Cut to keep the page light; the full file is on GitHub. */
  truncated: boolean
}

export function docKind(path: string): DocKind {
  const name = (path.split('/').pop() ?? '').replace(/\.(md|markdown)$/i, '')
  return KINDS.find((k) => k.match.test(name))?.kind ?? 'doc'
}

/**
 * The files to show, one per kind: the one nearest the root wins (ROADMAP.md
 * over docs/ROADMAP.md). `explicit` paths come first and replace a found file
 * of the same kind; `false` shows nothing.
 */
export function pickDocs(paths: readonly string[], explicit?: readonly string[] | false): DocPick[] {
  if (explicit === false) return []
  const chosen = (explicit ?? []).map((path) => ({ kind: docKind(path), path }))
  const depth = (p: string) => p.split('/').length
  for (const { kind } of KINDS) {
    if (chosen.some((c) => c.kind === kind)) continue
    const found = paths
      .filter((p) => /\.(md|markdown)$/i.test(p) && !SKIP.test(p) && docKind(p) === kind)
      .sort((a, b) => depth(a) - depth(b) || a.localeCompare(b))[0]
    if (found) chosen.push({ kind, path: found })
  }
  const order = (k: DocKind) => (k === 'doc' ? KINDS.length : KINDS.findIndex((x) => x.kind === k))
  return chosen.sort((a, b) => order(a.kind) - order(b.kind))
}

/**
 * Characters of cleaned HTML a file may bring to the page. The page carries
 * it twice (as markup and in the data React hydrates from), and the smoke
 * test holds every page's HTML to a budget. Changelogs are newest first, so
 * their top is what matters.
 */
export const DOC_LIMIT: Record<DocKind, number> = {
  roadmap: 24_000,
  milestones: 24_000,
  features: 24_000,
  changelog: 12_000,
  doc: 24_000,
}

/**
 * Long files are cut before the last heading that starts within `limit`
 * characters (with GitHub's wrapper around it), and whatever the cut left
 * open is closed again, so the page carries the newest part and links the
 * rest. Runs on HTML that prepareReadme already cleaned.
 */
export function trimDoc(html: string, limit = 24_000): { html: string; truncated: boolean } {
  if (html.length <= limit) return { html, truncated: false }
  let cut = -1
  for (const m of html.slice(0, limit).matchAll(/(?:<div class="markdown-heading"[^>]*>\s*)?<h[1-3][\s>]/g)) {
    if (m.index > 0) cut = m.index
  }
  return { html: balanceHtml(html.slice(0, cut > 0 ? cut : limit).replace(/<[^>]*$/, '')), truncated: true }
}

/** The folder a file sits in, with a trailing slash ('' at the root). */
export function docDir(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i + 1)
}
