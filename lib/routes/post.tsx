import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TimelinePost from '@/components/TimelinePost'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import type { Locale } from '@/lib/i18n'
import { localePath, pageAlternates } from '@/lib/localeRoutes'
import { allTimelineEntries, entryHasPage, entryPath, entryVisual, pick } from '@/lib/timeline'

function posts() {
  return allTimelineEntries(snapshotProjects()).filter(entryHasPage)
}

export function postParams() {
  return posts().map((e) => ({ id: e.id }))
}

/**
 * The link preview: the post's own card from scripts/generate-og.mjs, else
 * its picture, else the site's card. An 18+ video's still is never used.
 */
/** The card scripts/generate-og.mjs draws at deploy, else the post's picture, else the site's. */
function postImage(id: string, alt: string, locale: Locale) {
  if (existsSync(join(process.cwd(), 'public', 'og', 'posts', `${id}.${locale}.jpg`))) {
    return { ...OG_IMAGE, url: `${SITE_URL}/og/posts/${id}.${locale}.jpg`, type: 'image/jpeg', alt }
  }
  const entry = posts().find((e) => e.id === id)
  const visual = entry ? entryVisual(entry) : null
  return visual && !visual.sensitive ? { url: `${SITE_URL}${visual.src}`, alt } : OG_IMAGE
}

export function postMetadata(id: string, locale: Locale): Metadata {
  const entry = posts().find((e) => e.id === id)
  if (!entry) return {}
  const path = entryPath(entry.id)
  const url = `${SITE_URL}${localePath(path, locale)}`
  const title = `${pick(entry.title, locale)} — arn-c0de`
  const description = pick(entry.text, locale) || pick(entry.title, locale)
  const image = postImage(entry.id, pick(entry.title, locale), locale)
  return {
    title,
    description,
    alternates: pageAlternates(path, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: 'arn-c0de',
      type: 'article',
      publishedTime: entry.date,
      locale: locale === 'de' ? 'de_DE' : 'en_GB',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export function PostRoute({ id, locale }: { id: string; locale: Locale }) {
  const entry = posts().find((e) => e.id === id)
  if (!entry) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: pick(entry.title, locale),
    description: pick(entry.text, locale) || undefined,
    datePublished: entry.date,
    inLanguage: locale,
    url: `${SITE_URL}${localePath(entryPath(entry.id), locale)}`,
    keywords: entry.tags?.length ? entry.tags.join(', ') : undefined,
    author: { '@type': 'Person', name: 'arn-c0de', url: SITE_URL },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <TimelinePost id={entry.id} locale={locale} />
    </>
  )
}
