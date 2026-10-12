import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import QLinkPage from '@/components/QLinkPage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'

const DESCRIPTION =
  'QLink: a Rust game and simulation engine for Linux that runs on Quest 3 without the Quest Link PC app. Videos, roadmap and how to help.'

const url = `${SITE_URL}/qlink/`
// The project card from scripts/generate-og.mjs, else the site's.
const image = existsSync(join(process.cwd(), 'public', 'og', 'qlink.png'))
  ? { ...OG_IMAGE, url: `${SITE_URL}/og/qlink.png`, alt: 'QLink — arn-c0de' }
  : OG_IMAGE

export const metadata: Metadata = {
  title: 'QLink — arn-c0de',
  description: DESCRIPTION,
  alternates: { canonical: url },
  openGraph: { title: 'QLink — arn-c0de', description: DESCRIPTION, url, siteName: 'arn-c0de', type: 'website', images: [image] },
  twitter: { card: 'summary_large_image', title: 'QLink — arn-c0de', description: DESCRIPTION, images: [image] },
}

export default function Page() {
  return <QLinkPage />
}
