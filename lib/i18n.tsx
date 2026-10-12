'use client'

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { BASE_PATH, asset } from './basePath'
import { counterpartPath, localePath } from './localePath'
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

/** The page's path without the base path, for switching to its counterpart. */
function currentPath(): string {
  const base = BASE_PATH
  const path = location.pathname
  return base && path.startsWith(base) ? path.slice(base.length) || '/' : path
}

/**
 * The language is the page's: English at the root, German under /de/, both
 * prerendered. Choosing the other language goes to the other address and is
 * remembered; a visitor who chose German before, or whose browser is German
 * and who has not chosen, is sent to the German page on arrival.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale')
      const wanted: Locale | null =
        stored === 'de' || stored === 'en'
          ? stored
          : navigator.language?.toLowerCase().startsWith('de')
            ? 'de'
            : null
      if (wanted && wanted !== locale) {
        location.replace(asset(counterpartPath(currentPath(), wanted)) + location.search + location.hash)
      }
    } catch {
      /* Storage blocked — the page's own language it is. */
    }
  }, [locale])

  const choose = useCallback((next: Locale) => {
    try {
      localStorage.setItem('locale', next)
    } catch {
      /* Not remembered, but still applied. */
    }
    if (next !== locale) location.assign(asset(counterpartPath(currentPath(), next)) + location.search + location.hash)
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return <I18nContext.Provider value={{ locale, setLocale: choose }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return useMemo(
    () => ({
      ...value,
      labels: labels[value.locale],
      t: (text: string, vars?: Vars) => translate(value.locale, text, vars),
      /** A page of this site in the current language, base path included. */
      href: (path: string) => asset(localePath(path, value.locale)),
    }),
    [value],
  )
}
