/**
 * Every profile elsewhere, in one place: the overview, the footer, the
 * contact tab and the structured data for search engines all read this list.
 * Add a profile here and it appears everywhere at once.
 */
export interface Social {
  id: 'github' | 'youtube' | 'x'
  name: string
  handle: string
  href: string
}

export const SOCIALS: Social[] = [
  { id: 'github', name: 'GitHub', handle: 'arn-c0de', href: 'https://github.com/arn-c0de' },
  { id: 'youtube', name: 'YouTube', handle: '@arn-c0de', href: 'https://www.youtube.com/@arn-c0de' },
  { id: 'x', name: 'X', handle: '@arn_c0de', href: 'https://x.com/arn_c0de' },
]

export const YOUTUBE = SOCIALS.find((s) => s.id === 'youtube')!
