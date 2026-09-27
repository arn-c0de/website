'use client'

import { useState } from 'react'
import { asset } from '@/lib/basePath'
import { PGP_PUBLIC_KEY } from '@/lib/pgpKey'
import { CheckIcon, CopyIcon, RequestIcon } from './Icons'

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
      {copied ? 'Copied' : label}
    </button>
  )
}

export default function ContactPane({ onStartRequest }: { onStartRequest: () => void }) {
  return (
    <div className="pane">
      <div className="pane__head">
        <h1 className="pane__title">Get in touch</h1>
        <p className="pane__lede">
          Questions about my projects, something you would like built, or a bug you ran into — all
          welcome here. Pick whichever channel suits, and encrypt it if what you are sending should
          stay private.
        </p>
      </div>

      {/* The two channels that actually work lead; Matrix is a footnote until
          it does. */}
      <div className="channels">
        <article className="channel" data-reveal>
          <div className="channel__head">
            <h2 className="channel__name">SimpleX Chat</h2>
            <span className="pill">preferred</span>
          </div>
          <p className="channel__text">
            No phone number, no account, no identifier on a server — the easiest option for a
            private first message or a quick back-and-forth.
          </p>
          <div className="channel__actions">
            <a
              className="btn btn--primary"
              href={SIMPLEX_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open SimpleX invite
            </a>
            <CopyButton value={SIMPLEX_LINK} label="Copy link" />
          </div>
        </article>

        <article className="channel" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
          <div className="channel__head">
            <h2 className="channel__name">Email</h2>
            <span className="pill pill--quiet mono">{EMAIL}</span>
          </div>
          <p className="channel__text">
            Fine for anything ordinary. For sensitive technical detail, encrypt your message with
            the PGP key below before sending it.
          </p>
          <div className="channel__actions">
            <a className="btn btn--primary" href={`mailto:${EMAIL}`}>
              Write email
            </a>
            <CopyButton value={EMAIL} label="Copy address" />
          </div>
        </article>

        <article
          className="channel channel--muted"
          data-reveal
          style={{ '--i': 2 } as React.CSSProperties}
        >
          <div className="channel__head">
            <h2 className="channel__name">Matrix</h2>
            <span className="pill pill--quiet">unavailable</span>
          </div>
          <p className="channel__text">Not set up at the moment — use SimpleX or email instead.</p>
        </article>
      </div>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">Not sure it is worth a message?</h2>
            <p className="band__hint">All of these are.</p>
          </div>
          <div className="band__nav">
            <button type="button" className="btn btn--sm btn--request" onClick={onStartRequest}>
              <RequestIcon />
              Start a request
            </button>
          </div>
        </div>
        <div className="tagrow">
          {SUITABLE_FOR.map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
        </div>
        <p className="section__hint">For private projects and test access, send a short use case and the project you are interested in. Access is reviewed and granted manually.</p>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">PGP public key</h2>
            <p className="band__hint">For anything that should not travel as plain text.</p>
          </div>
        </div>

        <div className="callout callout--warn">
          <strong>Check before you trust.</strong> Confirm the fingerprint through a second,
          independent channel before sending anything sensitive. This page alone is not enough.
        </div>

        <div className="key">
          <div className="key__print">
            <span className="key__label">Fingerprint</span>
            <span className="key__value mono">{FINGERPRINT}</span>
          </div>

          <dl className="deflist">
            {KEY_FACTS.map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="channel__actions">
            <a className="btn" href={asset('/arn-c0de.asc')} download="arn-c0de.asc">
              Download .asc
            </a>
            <CopyButton value={PGP_PUBLIC_KEY} label="Copy key block" />
          </div>

          {/* The armoured block is long and rarely read on screen — folded away
              rather than dominating the page. */}
          <details className="keyfold">
            <summary>Show the key block</summary>
            <pre className="keyblock">{PGP_PUBLIC_KEY}</pre>
          </details>
        </div>
      </section>
    </div>
  )
}
