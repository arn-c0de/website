'use client'

import { useEffect, useState } from 'react'
import { formatRelative } from '@/lib/format'

/**
 * "3 days ago", safe to prerender. The static HTML carries the text as of
 * build time; the browser's clock can already be a day further, which would
 * be a hydration mismatch (React #418). So hydration keeps the built text and
 * a re-render right after mount switches to the visitor's clock.
 */
export default function RelativeTime({
  iso,
  locale,
  className,
}: {
  iso: string
  locale: 'en' | 'de'
  className?: string
}) {
  const [, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <span className={className} suppressHydrationWarning>
      {formatRelative(iso, locale)}
    </span>
  )
}
