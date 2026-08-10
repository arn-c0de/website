import type { MetadataRoute } from 'next'
import { asset } from '@/lib/basePath'

// Generated rather than kept as a static file so start_url, scope and the icon
// paths pick up the base path automatically.
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'arn-c0de — project console',
    short_name: 'arn-c0de',
    description:
      'Embedded firmware, local LLM and RAG systems, game AI, network security tooling, backends and Android apps. Open source projects by arn-c0de.',
    start_url: asset('/'),
    scope: asset('/'),
    display: 'standalone',
    background_color: '#0a0c10',
    theme_color: '#0a0c10',
    icons: [
      { src: asset('/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: asset('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: asset('/icon-maskable.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
