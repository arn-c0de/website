import type { Metadata } from 'next'
import { PostRoute, postMetadata, postParams } from '@/lib/routes/post'

// Every post is known at build time; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = postParams

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return postMetadata((await params).id, 'en')
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PostRoute id={(await params).id} locale="en" />
}
