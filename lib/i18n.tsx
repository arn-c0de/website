'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DE, LONG } from './i18n-de'

export type Locale = 'en' | 'de'

const labels = {
  en: { overview: 'Overview', projects: 'Projects', timeline: 'Timeline', stack: 'Stack', about: 'About', contact: 'Contact', request: 'Request' },
  de: { overview: 'Übersicht', projects: 'Projekte', timeline: 'Zeitstrahl', stack: 'Stack', about: 'Über mich', contact: 'Kontakt', request: 'Anfrage' },
} as const

type Vars = Record<string, string | number>

/**
 * The English text is the key. Components keep reading like English, a
 * missing German entry falls back to the original instead of showing a key,
 * and `{name}` placeholders are filled in either language.
 */
function translate(locale: Locale, text: string, vars?: Vars): string {
  const long = LONG[text]
  const template = long ? long[locale] : locale === 'de' ? (DE[text] ?? text) : text
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  // A stored choice wins; otherwise a German browser gets German.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale')
      if (stored === 'de' || stored === 'en') setLocale(stored)
      else if (navigator.language?.toLowerCase().startsWith('de')) setLocale('de')
    } catch {
      /* Storage blocked — English it is. */
    }
  }, [])
  const choose = useCallback((next: Locale) => {
    setLocale(next)
    try {
      localStorage.setItem('locale', next)
    } catch {
      /* Not remembered, but still applied. */
    }
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return (
    <I18nContext.Provider value={{ locale, setLocale: choose }}>{children}</I18nContext.Provider>
  )
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return useMemo(
    () => ({
      ...value,
      labels: labels[value.locale],
      t: (text: string, vars?: Vars) => translate(value.locale, text, vars),
    }),
    [value],
  )
}
