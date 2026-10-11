import type { Metadata, Viewport } from 'next'
import { SITE_URL, asset } from '@/lib/basePath'
import videoData from '@/data/videos.json'
import { SOCIALS } from '@/lib/socials'
import type { VideoData } from '@/lib/youtube-feed'
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
  title: 'arn-c0de (arn-code) — project console',
  description: DESCRIPTION,
  keywords: [
    'arn-c0de',
    'arn-code',
    'arn code',
    'embedded systems',
    'network security',
    'ESP32',
    'firmware',
    'AI agents',
    'Python',
    'Rust',
  ],
  authors: [{ name: 'arn-c0de', url: 'https://github.com/arn-c0de' }],
  manifest: asset('/manifest.webmanifest'),
  // Favicon and apple-touch icon come from app/icon.png and app/apple-icon.png
  // via Next's file convention, which handles the base path itself.
  openGraph: {
    title: 'arn-c0de (arn-code) — project console',
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: 'arn-c0de',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'arn-c0de (arn-code) — project console',
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f11' },
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
 * come from where GitHub serves them. The one frame allowed is YouTube's
 * youtube-nocookie.com player, which the timeline only creates on a click.
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
  // Video files are served from this site; YouTube runs only in its
  // privacy-enhanced player, and only after a visitor presses play.
  "media-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
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

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'arn-c0de',
  alternateName: ['arn-code', 'arn_c0de', 'arn code'],
  url: `${SITE_URL}/`,
  sameAs: SOCIALS.map((s) => s.href),
  jobTitle: 'Embedded Systems & Security Software Developer',
  knowsAbout: ['Embedded Systems', 'Network Security', 'Python', 'Rust', 'Kotlin', 'ESP32', 'AI Systems'],
}

/**
 * The channel videos the timeline shows, described for search engines. Built
 * from the same data/videos.json the deploy fetches, so it never names a video
 * the page does not have.
 */
const videoJsonLd = (videoData as VideoData).videos.map((v) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: v.title,
  description: v.summary || v.title,
  uploadDate: v.date,
  ...(v.poster ? { thumbnailUrl: `${SITE_URL}${v.poster}` } : {}),
  contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
  author: { '@type': 'Person', name: 'arn-c0de', url: `${SITE_URL}/` },
}))

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {videoJsonLd.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
