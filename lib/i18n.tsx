'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'de'

const labels = {
  en: { overview: 'Overview', projects: 'Projects', stack: 'Stack', about: 'About', contact: 'Contact', request: 'Request' },
  de: { overview: 'Übersicht', projects: 'Projekte', stack: 'Stack', about: 'Über mich', contact: 'Kontakt', request: 'Anfrage' },
} as const

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    const stored = localStorage.getItem('locale')
    if (stored === 'de' || stored === 'en') setLocale(stored)
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem('locale', locale)
  }, [locale])
  return <I18nContext.Provider value={{ locale, setLocale }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return useMemo(() => ({ ...value, labels: labels[value.locale] }), [value])
}
