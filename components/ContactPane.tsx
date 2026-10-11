'use client'

import { useState } from 'react'
import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
import { PGP_PUBLIC_KEY } from '@/lib/pgpKey'
import { CheckIcon, CopyIcon, RequestIcon } from './Icons'
import SocialLinks from './SocialLinks'

const SIMPLEX_LINK =
  'https://smp19.simplex.im/a#12EFYcsND4k7C7Gz1wUT7mKrt5-u84PqnHTBUZXw0eg'
const EMAIL = 'arn-c0de@protonmail.com'
const FINGERPRINT = '93A7 8377 0EEA FFA4 3B24  22F1 A0F9 A2E7 0D64 2ADC'

const SUITABLE_FOR = [
  'questions about one of my projects',
  'help getting something set up',
  'bugs or security findings',
  'an idea you would like built',
  'working on something together',
  'anything confidential',
]

const KEY_FACTS = [
  ['Key ID', 'A0F9A2E70D642ADC'],
  ['Algorithm', 'ed25519 (signing) · cv25519 (encryption)'],
  ['Created', '2026-05-13'],
  ['Expires', '2028-05-12'],
  ['User ID', `arn-c0de <${EMAIL}>`],
]

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked — the value is selectable on screen anyway. */
    }
  }

  return (
    <button type="button" className={`btn${copied ? ' btn--copied' : ''}`} onClick={copy}>
      {/* Keyed so the tick mounts fresh and pops rather than swapping in flat. */}
      <span className="btn__icon" key={copied ? 'done' : 'idle'}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      {copied ? t('Copied') : label}
    </button>
  )
}

export default function ContactPane({ onStartRequest }: { onStartRequest: () => void }) {
  const { t } = useI18n()
  return (
    <div className="pane contact">
      <div className="pane__head">
        <h1 className="pane__title">{t('Get in touch')}</h1>
        <p className="pane__lede">{t('CONTACT_LEDE')}</p>
      </div>

      {/* The two channels that actually work lead; Matrix is a footnote until
          it does. */}
      <div className="channels">
        <article className="channel" data-reveal>
          <div className="channel__head">
            <h2 className="channel__name">SimpleX Chat</h2>
            <span className="pill">{t('preferred')}</span>
          </div>
          <p className="channel__text">{t('CONTACT_SIMPLEX')}</p>
          <div className="channel__actions">
            <a
              className="btn btn--primary"
              href={SIMPLEX_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Open SimpleX invite')}
            </a>
            <CopyButton value={SIMPLEX_LINK} label={t('Copy link')} />
          </div>
        </article>

        <article className="channel" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          <div className="channel__head">
            <h2 className="channel__name">{t('Email')}</h2>
            <span className="pill pill--quiet mono">{EMAIL}</span>
          </div>
          <p className="channel__text">{t('CONTACT_EMAIL')}</p>
          <div className="channel__actions">
            <a className="btn btn--primary" href={`mailto:${EMAIL}`}>
              {t('Write email')}
            </a>
            <CopyButton value={EMAIL} label={t('Copy address')} />
          </div>
        </article>

      </div>

      <p className="channels__note">
        <strong>Matrix</strong> {t('is not set up at the moment — use SimpleX or email instead.')}
      </p>

      <div className="contact__socials">
        <h2 className="band__title">{t('Elsewhere')}</h2>
        <p className="band__hint">{t('Videos, code and short updates — public, not for private messages.')}</p>
        <SocialLinks />
      </div>

      <section className="band">
        <div className="reasons" data-reveal>
          <div className="reasons__text">
            <h2 className="band__title">{t('Good reasons to write')}</h2>
            <ul className="checklist">
              {SUITABLE_FOR.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {t(item)}
                </li>
              ))}
            </ul>
          </div>
          <div className="reasons__side">
            <p>{t('CONTACT_ACCESS')}</p>
            <button type="button" className="btn btn--request" onClick={onStartRequest}>
              <RequestIcon />
              {t('Start a request')}
            </button>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('PGP public key')}</h2>
            <p className="band__hint">{t('For anything that should not travel as plain text.')}</p>
          </div>
        </div>

        <div className="callout callout--warn">
          <strong>{t('Check before you trust.')}</strong> {t('CONTACT_TRUST')}
        </div>

        <div className="key">
          <div className="key__print">
            <span className="key__label">{t('Fingerprint')}</span>
            <span className="key__value mono">{FINGERPRINT}</span>
          </div>

          <dl className="deflist">
            {KEY_FACTS.map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{t(k)}</dt>
                <dd>{t(v)}</dd>
              </div>
            ))}
          </dl>

          <div className="channel__actions">
            <a className="btn" href={asset('/arn-c0de.asc')} download="arn-c0de.asc">
              {t('Download .asc')}
            </a>
            <CopyButton value={PGP_PUBLIC_KEY} label={t('Copy key block')} />
          </div>

          {/* The armoured block is long and rarely read on screen — folded away
              rather than dominating the page. */}
          <details className="keyfold">
            <summary>{t('Show the key block')}</summary>
            <pre className="keyblock">{PGP_PUBLIC_KEY}</pre>
          </details>
        </div>
      </section>
    </div>
  )
}
