import type { Metadata } from 'next'
import { ProjectRoute, projectMetadata, projectParams } from '@/lib/routes/project'

// A static export knows every page at build time; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = projectParams

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return projectMetadata((await params).slug, 'en')
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ProjectRoute slug={(await params).slug} locale="en" />
}
