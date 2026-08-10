/**
 * Draws the social preview card — the image a link to this site unfurls into
 * on Discord, Mastodon, LinkedIn and the rest.
 *
 *   node scripts/generate-og.mjs
 *
 * Writes public/og.png (1200×630); commit the result. Next can generate this
 * from `app/opengraph-image.tsx` instead, but a metadata route exports as an
 * *extensionless* file, and GitHub Pages then serves it as
 * application/octet-stream — which is exactly what every unfurler refuses. A
 * plain .png in public/ has the right content type and costs one command.
 *
 * `next/og` is WebAssembly, so this runs anywhere Node does. Elements are
 * built with createElement because this file is plain .mjs, not JSX.
 */
// The published `next/og` entry is CommonJS and is not exported for a plain
// `import`; the module it re-exports is.
import { ImageResponse } from 'next/dist/server/og/image-response.js'
import { createElement as h } from 'react'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png')

const INK = '#e7edf5'
const MUTED = '#aab4c4'
const FAINT = '#7d8797'

/** Deliberately typographic: no avatar, no logo, so it stays legible at the
 *  ~300px-wide preview most clients actually render. */
const card = h(
  'div',
  {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '84px 88px',
      background: '#0a0c10',
      // The site's accent, as the one bright edge.
      borderLeft: '16px solid #4f8cff',
      color: INK,
    },
  },
  h('div', { style: { fontSize: 30, letterSpacing: 6, color: FAINT } }, 'PROJECT CONSOLE'),
  h('div', { style: { fontSize: 132, fontWeight: 700, marginTop: 14 } }, 'arn-c0de'),
  // Three short lines rather than two long ones: the renderer wraps on its
  // own otherwise, and a wrapped line leaves one orphaned word hanging.
  ...[
    'Embedded firmware · local LLMs & RAG',
    'game AI & simulation · network & security tooling',
    'backends & databases · web apps · Android',
  ].map((line, i) =>
    h(
      'div',
      { key: line, style: { fontSize: 34, lineHeight: 1.45, marginTop: i === 0 ? 26 : 0, color: MUTED } },
      line,
    ),
  ),
  h('div', { style: { fontSize: 30, marginTop: 40, color: FAINT } }, 'github.com/arn-c0de'),
)

const png = await new ImageResponse(card, { width: 1200, height: 630 }).arrayBuffer()
writeFileSync(out, Buffer.from(png))
console.log(`public/og.png — ${(png.byteLength / 1024).toFixed(1)} kB`)
