import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import DeepVisionPage from '@/components/DeepVisionPage'
import { OG_IMAGE, SITE_URL } from '@/lib/basePath'
import type { Locale } from '@/lib/i18n'
import { localePath, pageAlternates } from '@/lib/localeRoutes'

const TITLE = 'DeepVision-Web — arn-c0de'
const DESCRIPTION: Record<Locale, string> = {
  en: 'DeepVision-Web: PCB inspection with a phone in the browser — recognition, placement overlay, stabilized Deep Zoom and automatic optical inspection. A private project with occasional previews.',
  de: 'DeepVision-Web: Leiterplatten-Prüfung mit dem Handy im Browser — Erkennung, Bestückungs-Overlay, stabilisierter Deep Zoom und automatische optische Inspektion. Ein privates Projekt mit vereinzelten Einblicken.',
}

export function deepvisionMetadata(locale: Locale): Metadata {
  const url = `${SITE_URL}${localePath('/deepvision/', locale)}`
  const description = DESCRIPTION[locale]
  const image = existsSync(join(process.cwd(), 'public', 'og', 'deepvision.png'))
    ? { ...OG_IMAGE, url: `${SITE_URL}/og/deepvision.png`, alt: TITLE }
    : OG_IMAGE
  return {
    title: TITLE,
    description,
    alternates: pageAlternates('/deepvision/', locale),
    openGraph: { title: TITLE, description, url, siteName: 'arn-c0de', type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title: TITLE, description, images: [image] },
  }
}

export function DeepVisionRoute({ locale }: { locale: Locale }) {
  return <DeepVisionPage locale={locale} />
}
