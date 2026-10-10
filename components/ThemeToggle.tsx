'use client'

import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { usePrefersReducedMotion } from '@/lib/useMotion'
import { useI18n } from '@/lib/i18n'
import { MoonIcon, SunIcon } from './Icons'

type Theme = 'light' | 'dark' | 'system'

/**
 * Three-state toggle: system → light → dark → system. The `data-theme`
 * attribute overrides the media query in globals.css; removing it hands
 * control back to the OS.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const reduced = usePrefersReducedMotion()
  const { t } = useI18n()

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  function cycle() {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'

    const apply = () => {
      // flushSync so the icon swaps inside the same view transition as the
      // colours — otherwise React commits it after the snapshot is taken.
      flushSync(() => setTheme(next))
      if (next === 'system') {
        delete document.documentElement.dataset.theme
        localStorage.removeItem('theme')
      } else {
        document.documentElement.dataset.theme = next
        localStorage.setItem('theme', next)
      }
    }

    const button = buttonRef.current
    if (reduced || !button || !document.startViewTransition) {
      apply()
      return
    }

    // The new theme is revealed by a circle growing out of this button, so the
    // switch visibly starts where it was pressed.
    const box = button.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    // Marks which transition is running: the rules for the wipe are scoped to
    // it, so a tab change can style the same pseudo-elements differently.
    document.documentElement.dataset.vt = 'theme'
    const transition = document.startViewTransition(apply)
    const clear = () => delete document.documentElement.dataset.vt
    transition.finished.then(clear, clear)
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 520,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      // An interrupted transition is not worth reporting; the theme is set
      // either way because `apply` runs synchronously inside it.
      .catch(() => {})
  }

  const label =
    theme === 'system'
      ? t('Theme: follows system')
      : t(theme === 'dark' ? 'Theme: dark (click to change)' : 'Theme: light (click to change)')

  return (
    <button
      type="button"
      ref={buttonRef}
      className="iconbtn iconbtn--theme"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      {/* Keyed on the theme so each icon mounts fresh and spins in. */}
      <span className="themeicon" key={theme}>
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </span>
      {theme === 'system' && <span className="themeicon__auto">AUTO</span>}
    </button>
  )
}
