import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import QLinkPage from '@/components/QLinkPage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import type { Locale } from '@/lib/i18n'
import { localePath, pageAlternates } from '@/lib/localeRoutes'

const DESCRIPTION: Record<Locale, string> = {
  en: 'QLink: a Rust game and simulation engine for Linux that runs on Quest 3 without the Quest Link PC app. Videos, roadmap and how to help.',
  de: 'QLink: eine Spiel- und Simulations-Engine in Rust für Linux, die auf der Quest 3 ohne die Quest-Link-PC-App läuft. Videos, Roadmap und wie man mithelfen kann.',
}

export function qlinkMetadata(locale: Locale): Metadata {
  const url = `${SITE_URL}${localePath('/qlink/', locale)}`
  const description = DESCRIPTION[locale]
  // The project card from scripts/generate-og.mjs, else the site's.
  const image = existsSync(join(process.cwd(), 'public', 'og', 'qlink.png'))
    ? { ...OG_IMAGE, url: `${SITE_URL}/og/qlink.png`, alt: 'QLink — arn-c0de' }
    : OG_IMAGE
  return {
    title: 'QLink — arn-c0de',
    description,
    alternates: pageAlternates('/qlink/', locale),
    openGraph: { title: 'QLink — arn-c0de', description, url, siteName: 'arn-c0de', type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title: 'QLink — arn-c0de', description, images: [image] },
  }
}

export function QLinkRoute({ locale }: { locale: Locale }) {
  return <QLinkPage locale={locale} />
}
