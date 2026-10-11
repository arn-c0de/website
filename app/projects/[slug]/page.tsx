import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectPage from '@/components/ProjectPage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import { pageProjects, projectSlug } from '@/lib/projectPages'
import type { PreparedReadme } from '@/lib/readmeHtml'

// A static export knows every page at build time; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return pageProjects().map((p) => ({ slug: projectSlug(p) }))
}

/** Written by scripts/fetch-readmes.mjs before the build; absent locally. */
function bakedReadme(repo: string): PreparedReadme | null {
  const file = join(process.cwd(), 'data', 'readmes', `${repo}.json`)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as PreparedReadme
  } catch {
    return null
  }
}

function find(slug: string) {
  return pageProjects().find((p) => projectSlug(p) === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = find((await params).slug)
  if (!project) return {}
  const url = `${SITE_URL}/projects/${projectSlug(project)}/`
  const title = `${project.title} — arn-c0de`
  const description = project.description ?? `${project.title}, an open-source project by arn-c0de.`
  // The project's own card from scripts/generate-og.mjs; a project added
  // since the cards were last drawn falls back to the site's.
  const slug = projectSlug(project)
  const image = existsSync(join(process.cwd(), 'public', 'og', `${slug}.png`))
    ? { ...OG_IMAGE, url: `${SITE_URL}/og/${slug}.png`, alt: `${project.title} — arn-c0de` }
    : OG_IMAGE
  return {
    title,
    description,
    alternates: { canonical: url },
    // Spelled out in full: a page's openGraph replaces the layout's, image and all.
    openGraph: { title, description, url, siteName: 'arn-c0de', type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug)
  if (!project) notFound()

  // Lets search engines read the page as a code project, not just a web page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.description ?? undefined,
    url: `${SITE_URL}/projects/${projectSlug(project)}/`,
    codeRepository: project.html_url || undefined,
    programmingLanguage: project.language ?? undefined,
    license: project.license && project.license !== 'NOASSERTION' ? project.license : undefined,
    keywords: project.topics.length ? project.topics.join(', ') : undefined,
    dateCreated: project.created_at || undefined,
    dateModified: project.pushed_at || undefined,
    author: { '@type': 'Person', name: 'arn-c0de', url: SITE_URL },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProjectPage name={project.name} readme={bakedReadme(project.name)} />
    </>
  )
}
