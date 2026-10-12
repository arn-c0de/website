'use client'

import { usePathname } from 'next/navigation'
import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
import { counterpartPath } from '@/lib/localePath'

/**
 * A real link to this page in the other language, so crawlers can follow it
 * too. A click also remembers the choice and keeps the tab and anchor.
 */
export default function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const other = locale === 'en' ? 'de' : 'en'
  const href = asset(counterpartPath(usePathname() || '/', other))
  const label = locale === 'en' ? 'Auf Deutsch anzeigen' : 'Show in English'
  return (
    <a
      className="iconbtn langtoggle"
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault()
        setLocale(other)
      }}
    >
      {locale === 'en' ? 'DE' : 'EN'}
    </a>
  )
}
