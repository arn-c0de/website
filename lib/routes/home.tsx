import type { Metadata } from 'next'
import AppShell from '@/components/AppShell'
import { OG_IMAGE } from '@/lib/basePath'
import type { Locale } from '@/lib/i18n'
import { pageAlternates, localePath } from '@/lib/localeRoutes'
import { SITE_URL } from '@/lib/basePath'

const COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'arn-c0de (arn-code) — project console',
    description:
      'Open-source projects by arn-c0de: web apps and backends, embedded firmware, local LLM and RAG systems, game AI, network security tooling and Android apps.',
  },
  de: {
    title: 'arn-c0de (arn-code) — Projektkonsole',
    description:
      'Open-Source-Projekte von arn-c0de: Web-Apps und Backends, Embedded-Firmware, lokale LLM- und RAG-Systeme, Spiel-KI, Netzwerk-Sicherheitswerkzeuge und Android-Apps.',
  },
}

/**
 * The overview. The tabs are views of this one page (?tab=…), so they share
 * its canonical address instead of counting as pages of their own.
 */
export function homeMetadata(locale: Locale): Metadata {
  const { title, description } = COPY[locale]
  const url = `${SITE_URL}${localePath('/', locale)}`
  return {
    title,
    description,
    alternates: pageAlternates('/', locale),
    openGraph: {
      title,
      description,
      url,
      siteName: 'arn-c0de',
      type: 'website',
      locale: locale === 'de' ? 'de_DE' : 'en_GB',
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  }
}

export function HomeRoute({ locale }: { locale: Locale }) {
  return <AppShell locale={locale} />
}
