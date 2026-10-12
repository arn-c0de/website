import type { Metadata } from 'next'
import { SITE_URL } from './basePath'
import { FEED_PATH } from './feed'
import type { Locale } from './i18n'
import { localePath } from './localePath'

export { counterpartPath, localePath } from './localePath'

/**
 * Canonical and hreflang for a page that exists in both languages, plus the
 * timeline feed in the page's language first. A page's `alternates` replaces
 * the layout's, so the feeds are repeated here.
 */
export function pageAlternates(path: string, locale: Locale): NonNullable<Metadata['alternates']> {
  const feeds = [
    { url: `${SITE_URL}${FEED_PATH.en}`, title: 'arn-c0de — timeline' },
    { url: `${SITE_URL}${FEED_PATH.de}`, title: 'arn-c0de — Zeitstrahl (Deutsch)' },
  ]
  return {
    canonical: `${SITE_URL}${localePath(path, locale)}`,
    languages: {
      en: `${SITE_URL}${path}`,
      de: `${SITE_URL}${localePath(path, 'de')}`,
      'x-default': `${SITE_URL}${path}`,
    },
    types: { 'application/atom+xml': locale === 'de' ? [feeds[1], feeds[0]] : feeds },
  }
}
