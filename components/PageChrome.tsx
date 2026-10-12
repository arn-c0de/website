'use client'

import { useState } from 'react'
import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
import { CheckIcon, ChevronIcon, CopyIcon } from './Icons'
import LanguageToggle from './LanguageToggle'
import SocialLinks from './SocialLinks'
import ThemeToggle from './ThemeToggle'

/**
 * The frame of the pages that live outside the tabbed app — project pages
 * and timeline posts: a slim top bar with the way back, and the footer.
 */
export default function PageChrome({
  back,
  action,
  children,
}: {
  back: { href: string; label: string }
  /** Extra control at the right of the top bar. */
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const { t, href } = useI18n()
  const home = href('/')

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__row">
          <a className="brand" href={home}>
            <img className="brand__mark" src={asset('/avatar.jpg')} alt="" width={28} height={28} />
            <span className="brand__name">arn-c0de</span>
          </a>
          <a className="pp-back" href={back.href}>
            <ChevronIcon dir="left" />
            {back.label}
          </a>
          <span className="topbar__spacer" />
          {action}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__row">
            <a className="footer__brand" href={home}>
              <img src={asset('/avatar.jpg')} alt="" width={22} height={22} />
              <span>arn-c0de</span>
              <span className="footer__sep" aria-hidden>·</span>
              <span className="footer__muted">{t('Web apps, backends, embedded systems and local AI')}</span>
            </a>
            <span className="footer__link">
              <SocialLinks variant="icons" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Copies the address of the page itself, without any anchor. */
export function CopyPageLink() {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href.split('#')[0])
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked — the URL is in the address bar either way. */
    }
  }

  return (
    <button type="button" className={`btn${copied ? ' btn--copied' : ''}`} onClick={copy}>
      <span className="btn__icon" key={copied ? 'done' : 'idle'}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      {copied ? t('Copied') : t('Copy link')}
    </button>
  )
}
