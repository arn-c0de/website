import { SITE_URL } from '@/lib/basePath'
import { buildAtomFeed } from '@/lib/feed'
import { snapshotProjects } from '@/lib/github'
import { allTimelineEntries } from '@/lib/timeline'

// Written once at build time, like the sitemap.
export const dynamic = 'force-static'

export function GET() {
  return new Response(buildAtomFeed(allTimelineEntries(snapshotProjects()), 'en', SITE_URL), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  })
}
