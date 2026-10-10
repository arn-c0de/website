'use client'

import { useI18n } from '@/lib/i18n'

export default function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const label = locale === 'en' ? 'Auf Deutsch anzeigen' : 'Show in English'
  return (
    <button
      type="button"
      className="iconbtn langtoggle"
      onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}
      aria-label={label}
      title={label}
      lang={locale === 'en' ? 'de' : 'en'}
    >
      {locale === 'en' ? 'DE' : 'EN'}
    </button>
  )
}
