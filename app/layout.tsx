import type { Metadata, Viewport } from 'next'
import { SITE_URL, asset } from '@/lib/basePath'
import '@fontsource-variable/manrope'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

const DESCRIPTION =
  'Open-source projects by arn-c0de: embedded firmware, local LLM and RAG systems, game AI, network security tooling, backends and Android apps.'

/**
 * The social preview is `public/og.png`, written by `scripts/generate-og.mjs`
 * and referenced by its absolute URL — Open Graph consumers do not resolve
 * relative paths, and the site does not sit at a domain root.
 */
const OG_IMAGE = {
  url: `${SITE_URL}/og.png`,
  width: 1200,
  height: 630,
  alt: 'arn-c0de — project console',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'arn-c0de — project console',
  description: DESCRIPTION,
  manifest: asset('/manifest.webmanifest'),
  // Favicon and apple-touch icon come from app/icon.png and app/apple-icon.png
  // via Next's file convention, which handles the base path itself.
  openGraph: {
    title: 'arn-c0de — project console',
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: 'arn-c0de',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'arn-c0de — project console',
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c10' },
  ],
  width: 'device-width',
  initialScale: 1,
}

/**
 * Applies the stored theme before first paint. Without this the app flashes
 * the system theme for a frame when the visitor has picked the other one.
 */
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
