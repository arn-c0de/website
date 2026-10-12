import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TimelinePost from '@/components/TimelinePost'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import { allTimelineEntries, entryHasPage, entryPath, entryVisual, pick } from '@/lib/timeline'

// Every post is known at build time; anything else is a 404.
export const dynamicParams = false

function posts() {
  return allTimelineEntries(snapshotProjects()).filter(entryHasPage)
}

export function generateStaticParams() {
  return posts().map((e) => ({ id: e.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const entry = posts().find((e) => e.id === id)
  if (!entry) return {}
  const url = `${SITE_URL}${entryPath(entry.id)}`
  const title = `${pick(entry.title, 'en')} — arn-c0de`
  const description = pick(entry.text, 'en') || pick(entry.title, 'en')
  // The entry's own picture when it has one, else the site's card. An 18+
  // video's still never becomes a link preview.
  const visual = entryVisual(entry)
  const image = visual && !visual.sensitive ? { url: `${SITE_URL}${visual.src}`, alt: pick(entry.title, 'en') } : OG_IMAGE
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'arn-c0de', type: 'article', publishedTime: entry.date, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = posts().find((e) => e.id === id)
  if (!entry) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: pick(entry.title, 'en'),
    description: pick(entry.text, 'en') || undefined,
    datePublished: entry.date,
    url: `${SITE_URL}${entryPath(entry.id)}`,
    keywords: entry.tags?.length ? entry.tags.join(', ') : undefined,
    author: { '@type': 'Person', name: 'arn-c0de', url: SITE_URL },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <TimelinePost id={entry.id} />
    </>
  )
}
