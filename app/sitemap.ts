import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/basePath'

// Required for `output: 'export'` — the sitemap is generated once at build time.
export const dynamic = 'force-static'

/**
 * The app is one page with query-string views, so the sitemap lists the tab
 * URLs — those are what a visitor would share or a crawler would index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // '' is the overview; the other tabs each carry their query string.
  return ['', '?tab=projects', '?tab=timeline', '?tab=stack', '?tab=about', '?tab=contact'].map((suffix) => ({
    url: `${SITE_URL}/${suffix}`,
    changeFrequency: 'weekly',
    priority: suffix === '' ? 1 : 0.7,
  }))
}
