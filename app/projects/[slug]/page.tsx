import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectPage from '@/components/ProjectPage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import { pageProjects, projectSlug } from '@/lib/projectPages'

// A static export knows every page at build time; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return pageProjects().map((p) => ({ slug: projectSlug(p) }))
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
  return {
    title,
    description,
    alternates: { canonical: url },
    // Spelled out in full: a page's openGraph replaces the layout's, image and all.
    openGraph: { title, description, url, siteName: 'arn-c0de', type: 'website', images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
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
      <ProjectPage name={project.name} />
    </>
  )
}
