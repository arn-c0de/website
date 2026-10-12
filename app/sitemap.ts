import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import { pageProjects, projectSlug } from '@/lib/projectPages'
import { allTimelineEntries, entryHasPage, entryPath } from '@/lib/timeline'

// Required for `output: 'export'` — the sitemap is generated once at build time.
export const dynamic = 'force-static'

/**
 * The app is one page with query-string views, so the sitemap lists the tab
 * URLs — those are what a visitor would share or a crawler would index — plus
 * the prerendered page of every public project and every timeline post.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // '' is the overview; the other tabs each carry their query string.
  const tabs = ['', '?tab=projects', '?tab=timeline', '?tab=stack', '?tab=about', '?tab=contact'].map(
    (suffix): MetadataRoute.Sitemap[number] => ({
      url: `${SITE_URL}/${suffix}`,
      changeFrequency: 'weekly',
      priority: suffix === '' ? 1 : 0.7,
    }),
  )
  // Each public project also has a page of its own.
  const projects = pageProjects().map(
    (p): MetadataRoute.Sitemap[number] => ({
      url: `${SITE_URL}/projects/${projectSlug(p)}/`,
      lastModified: p.pushed_at || undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    }),
  )
  const posts = allTimelineEntries(snapshotProjects())
    .filter(entryHasPage)
    .map(
      (e): MetadataRoute.Sitemap[number] => ({
        url: `${SITE_URL}${entryPath(e.id)}`,
        lastModified: e.date,
        changeFrequency: 'monthly',
        priority: 0.5,
      }),
    )
  const qlink: MetadataRoute.Sitemap[number] = { url: `${SITE_URL}/qlink/`, changeFrequency: 'weekly', priority: 0.9 }
  return [...tabs, qlink, ...projects, ...posts]
}
