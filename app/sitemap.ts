import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import { localePath } from '@/lib/localePath'
import { pageProjects, projectSlug } from '@/lib/projectPages'
import { allTimelineEntries, entryHasPage, entryPath } from '@/lib/timeline'

// Required for `output: 'export'` — the sitemap is generated once at build time.
export const dynamic = 'force-static'

type Page = { path: string; lastModified?: string; changeFrequency: 'weekly' | 'monthly'; priority: number }

/**
 * Every prerendered page, in English and German, each listing the other as
 * its alternate. The tabs (?tab=…) are views of the overview and share its
 * canonical address, so they are not listed on their own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Page[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/qlink/', changeFrequency: 'weekly', priority: 0.9 },
    ...pageProjects().map(
      (p): Page => ({
        path: `/projects/${projectSlug(p)}/`,
        lastModified: p.pushed_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.6,
      }),
    ),
    ...allTimelineEntries(snapshotProjects())
      .filter(entryHasPage)
      .map((e): Page => ({ path: entryPath(e.id), lastModified: e.date, changeFrequency: 'monthly', priority: 0.5 })),
  ]

  return pages.flatMap(({ path, ...rest }) => {
    const languages = { en: `${SITE_URL}${path}`, de: `${SITE_URL}${localePath(path, 'de')}` }
    return (['en', 'de'] as const).map((locale) => ({
      url: languages[locale],
      ...rest,
      alternates: { languages },
    }))
  })
}
