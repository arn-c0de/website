import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import AgentOfficePage from '@/components/AgentOfficePage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import type { Locale } from '@/lib/i18n'
import { localePath, pageAlternates } from '@/lib/localeRoutes'

const TITLE = 'Agent Office — arn-c0de'
const DESCRIPTION: Record<Locale, string> = {
  en: 'Agent Office: a private, local control plane for a small team of AI coding agents — isolated workspaces, budgets, approvals on the phone and an isometric pixel-art office. Test versions on request.',
  de: 'Agent Office: eine private, lokale Steuerzentrale für ein kleines Team von KI-Coding-Agenten — isolierte Arbeitsbereiche, Budgets, Freigaben am Handy und ein isometrisches Pixel-Art-Büro. Testversionen auf Anfrage.',
}

export function agentOfficeMetadata(locale: Locale): Metadata {
  const url = `${SITE_URL}${localePath('/agent-office/', locale)}`
  const description = DESCRIPTION[locale]
  const image = existsSync(join(process.cwd(), 'public', 'og', 'agent-office.png'))
    ? { ...OG_IMAGE, url: `${SITE_URL}/og/agent-office.png`, alt: TITLE }
    : OG_IMAGE
  return {
    title: TITLE,
    description,
    alternates: pageAlternates('/agent-office/', locale),
    openGraph: { title: TITLE, description, url, siteName: 'arn-c0de', type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title: TITLE, description, images: [image] },
  }
}

export function AgentOfficeRoute({ locale }: { locale: Locale }) {
  return <AgentOfficePage locale={locale} />
}
