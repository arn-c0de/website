'use client'

import { useI18n } from '@/lib/i18n'

export default function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  return <button type="button" className="iconbtn langtoggle" onClick={() => setLocale(locale === 'en' ? 'de' : 'en')} aria-label="Change language" title="Change language">{locale === 'en' ? 'DE' : 'EN'}</button>
}
