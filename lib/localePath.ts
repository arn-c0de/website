import type { Locale } from './i18n'

/**
 * English lives at the root, German under /de/: every page is prerendered
 * in both, so search engines see each language at an address of its own.
 * Paths here are site-relative and without the base path.
 */
export function localePath(path: string, locale: Locale): string {
  if (locale !== 'de') return path
  return path === '/' ? '/de/' : `/de${path}`
}

/** A path in either language, as the given locale's version of it. */
export function counterpartPath(path: string, target: Locale): string {
  const bare = path === '/de' || path === '/de/' ? '/' : path.startsWith('/de/') ? path.slice(3) : path
  return localePath(bare, target)
}
