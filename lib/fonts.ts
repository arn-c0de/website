import localFont from 'next/font/local'

/**
 * The Latin subsets of the text and title faces, through next/font so the
 * build preloads them: the first paint already has the right font instead of
 * swapping in a moment later. The other subsets (Latin Extended, Cyrillic, …)
 * stay with @fontsource in layout.tsx and load only when a page needs them,
 * which is why --font-sans and --font-display name both families.
 *
 * next/font only takes literal options, hence the repeated unicode range
 * (the Latin range of @fontsource).
 */
export const manrope = localFont({
  src: '../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-manrope-latin',
  declarations: [{ prop: 'unicode-range', value: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' }],
  // A size-matched fallback would draw the non-Latin glyphs too; leave that to
  // the @fontsource faces instead.
  adjustFontFallback: false,
})

export const fraunces = localFont({
  src: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-fraunces-latin',
  declarations: [{ prop: 'unicode-range', value: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' }],
  adjustFontFallback: false,
})
