/**
 * Path prefix the site is served under — "/website" on GitHub Pages,
 * empty on a custom domain. Set in next.config.mjs.
 *
 * Next rewrites its own generated URLs using `basePath`, but plain strings in
 * `href`, `src` or metadata are left untouched. Wrap those in `asset()`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** `asset('/icon.svg')` → `/website/icon.svg` */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Absolute origin + base path, for sitemap, robots, Open Graph and structured
 * data. Without a base path the site is on its custom domain; with one it is
 * a project page under github.io. Naming the real domain keeps search
 * engines and link previews from going through GitHub's redirect.
 */
const ORIGIN = BASE_PATH ? 'https://arn-c0de.github.io' : 'https://arn-c0de.de'
export const SITE_URL = `${ORIGIN}${BASE_PATH}`
