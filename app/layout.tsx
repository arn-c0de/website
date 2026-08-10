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
 * The site claims in its own footer that the only host it ever talks to is
 * api.github.com. This is that claim written as something the browser
 * enforces instead of something a visitor has to believe.
 *
 * GitHub Pages cannot send headers, so it goes in a meta tag — which means no
 * `frame-ancestors` (header-only) and no nonces, and `script-src` therefore
 * has to allow inline: Next's hydration payload and the theme bootstrap below
 * are both inline scripts. The teeth are in `connect-src` and `img-src`: no
 * fetch, socket or beacon can reach anywhere else, and readme images can only
 * come from where GitHub serves them.
 */
// The dev server compiles modules through eval(); the exported site never
// does, and this folds to a constant at build time.
const SCRIPT_SRC =
  process.env.NODE_ENV === 'development' ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'"

const CSP = [
  "default-src 'self'",
  "connect-src 'self' https://api.github.com",
  "img-src 'self' data: https://*.githubusercontent.com https://github.com",
  `script-src ${SCRIPT_SRC}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "manifest-src 'self'",
  "form-action 'none'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

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
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
