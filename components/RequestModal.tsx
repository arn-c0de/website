'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INQUIRY_EMAIL,
  INQUIRY_TYPES,
  MAILTO_LIMIT,
  SERVICE_AREAS,
  TIMELINES,
  buildBody,
  buildMailto,
  buildSubject,
  looksLikeEmail,
  type InquiryTypeId,
  type RequestDraft,
  type ServiceAreaId,
} from '@/lib/request'
import { useI18n } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import SearchPicker, { type PickerItem } from './SearchPicker'
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  MailIcon,
  RequestIcon,
  RequestTypeIcon,
  SendIcon,
} from './Icons'

/** One labelled row. Every control in the form sits in one of these. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="frow">
      <span className="frow__label">{label}</span>
      <div className="frow__field">{children}</div>
    </div>
  )
}

export default function RequestModal({
  projects,
  selected,
  onSelectedChange,
  onClose,
}: {
  projects: Project[]
  selected: string[]
  onSelectedChange: (names: string[]) => void
  onClose: () => void
}) {
  const { t: tr } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<InquiryTypeId>('question')
  const [areas, setAreas] = useState<ServiceAreaId[]>([])
  const [timeline, setTimeline] = useState<RequestDraft['timeline']>(TIMELINES[0])
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(selected.length > 0)
  const [showPreview, setShowPreview] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const chosen = useMemo(
    () => selected.map((n) => projects.find((p) => p.name === n)).filter(Boolean) as Project[],
    [selected, projects],
  )

  const areaItems: PickerItem[] = useMemo(
    () =>
      SERVICE_AREAS.map((a) => ({
        id: a.id,
        title: tr(a.title),
        keywords: `${a.title} ${a.keywords}`,
      })),
    [tr],
  )

  /** Searching projects by language, topic or blurb beats scrolling a list. */
  const projectItems: PickerItem[] = useMemo(
    () =>
      projects.filter((p) => !p.noRequests).map((p) => ({
        id: p.name,
        title: p.title,
        keywords: [p.name, p.description ?? '', p.language ?? '', p.category, ...p.topics].join(' '),
        meta: p.language ?? undefined,
      })),
    [projects],
  )

  const draft: RequestDraft = { name, email, type, areas, timeline, message, projects: chosen }
  // The draft follows the interface language, so a German visitor writes a
  // German mail.
  const subject = buildSubject(draft, tr)
  const body = buildBody(draft, tr)
  const mailto = buildMailto(draft, tr)

  const missing: string[] = []
  if (!name.trim()) missing.push(tr('name'))
  if (!looksLikeEmail(email)) missing.push(tr('email'))
  if (!message.trim()) missing.push(tr('message'))
  const ready = missing.length === 0

  // Read through a ref rather than depended on: the parent hands this down as
  // a fresh arrow on every one of its renders, and re-running the effect below
  // would move focus again. On a phone that is fatal — opening the keyboard
  // resizes the window, which re-renders the shell, which would pull focus out
  // of the field that was just tapped and shut the keyboard again.
  const closeLatest = useRef(onClose)
  closeLatest.current = onClose

  // Opening the dialog: focus lands inside it, Escape closes it, and the page
  // behind holds still. All of it happens once, for as long as it is open.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeLatest.current()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    if (type !== 'access') return
    setAreas((current) => (current.includes('privateaccess') ? current : [...current, 'privateaccess']))
    setShowDetails(true)
  }, [type])

  function toggleArea(id: ServiceAreaId) {
    setAreas((current) => {
      if (id === 'unsure') return current.includes(id) ? [] : [id]

      const specific = current.filter((area) => area !== 'unsure')
      return specific.includes(id) ? specific.filter((area) => area !== id) : [...specific, id]
    })
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(
        `${tr('To')}: ${INQUIRY_EMAIL}\n${tr('Subject')}: ${subject}\n\n${body}`,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard blocked — the preview is selectable. */
    }
  }

  const emailInvalid = email.trim() !== '' && !looksLikeEmail(email)
  const checks = [
    { key: 'message', label: tr('Message'), done: message.trim() !== '' },
    { key: 'name', label: tr('Name'), done: name.trim() !== '' },
    { key: 'email', label: tr('Email'), done: looksLikeEmail(email) },
  ]

  return (
    <>
      <div className="scrim" style={{ zIndex: 55 }} onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <header className="modal__head">
          <span className="modal__mark" aria-hidden>
            <RequestIcon />
          </span>
          <div className="modal__heading">
            <h2 className="modal__title" id="request-title">
              {tr('Start a request')}
            </h2>
            <p className="modal__sub">{tr('Describe what you need. Add details only when they are useful.')}</p>
          </div>
          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label={tr('Close')}>
            <CloseIcon />
          </button>
        </header>

        <div className="modal__cols">
          <div className="modal__form">
            {/* Real radio inputs under the cards: arrow keys, focus and the
                checked state all come from the browser. */}
            <fieldset className="rq-group">
              <legend className="rq-label">{tr('What is it about?')}</legend>
              <div className="rq-types">
                {INQUIRY_TYPES.map((option) => (
                  <label key={option.id} className="rq-type">
                    <input
                      type="radio"
                      name="request-type"
                      value={option.id}
                      checked={type === option.id}
                      onChange={() => setType(option.id)}
                    />
                    <span className="rq-type__icon">
                      <RequestTypeIcon type={option.id} />
                    </span>
                    <span className="rq-type__label">{tr(option.label)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="rq-group">
              <span className="rq-label">
                {tr('What can I help with?')}
                <span className="rq-count" aria-hidden>
                  {message.trim().length > 0 ? message.trim().length : ''}
                </span>
              </span>
              <textarea
                className="input input--area rq-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={5}
                placeholder={tr('Tell me what you need and any useful context.')}
                aria-invalid={touched && !message.trim()}
              />
            </label>

            <div className="rq-row">
              <label className="rq-group">
                <span className="rq-label">{tr('Name')}</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={tr('Jane Doe')}
                  autoComplete="name"
                  aria-invalid={touched && !name.trim()}
                />
              </label>
              <label className="rq-group">
                <span className="rq-label">{tr('Email')}</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={tr('jane@example.com')}
                  autoComplete="email"
                  aria-invalid={emailInvalid || (touched && !looksLikeEmail(email))}
                  aria-describedby={emailInvalid ? 'request-email-error' : undefined}
                />
                {emailInvalid && (
                  <span className="rq-error" id="request-email-error">
                    {tr('That address does not look complete yet.')}
                  </span>
                )}
              </label>
            </div>

            <fieldset className="rq-group">
              <legend className="rq-label">{tr('Timing')}</legend>
              <div className="rq-chips">
                {TIMELINES.map((option) => (
                  <label key={option} className="rq-chip">
                    <input
                      type="radio"
                      name="request-timeline"
                      value={option}
                      checked={timeline === option}
                      onChange={() => setTimeline(option)}
                    />
                    {tr(option)}
                  </label>
                ))}
              </div>
            </fieldset>

            <details
              className="request-more"
              open={showDetails}
              onToggle={(event) => setShowDetails(event.currentTarget.open)}
            >
              <summary>
                <span>{tr('Optional details')}</span>
                <span className="request-more__hint">
                  {chosen.length || areas.length
                    ? tr('{n} selected', { n: chosen.length + areas.length })
                    : tr('Project or focus')}
                </span>
              </summary>
              <div className="request-more__body">
                <Row label={areas.length ? `${tr('Focus')} (${areas.length})` : tr('Focus')}>
                  <SearchPicker
                    items={areaItems}
                    selected={areas}
                    onToggle={(id) => toggleArea(id as ServiceAreaId)}
                    placeholder={tr('Search topics — PCVR, access, Rust…')}
                    label={tr('Search focus areas')}
                  />
                </Row>

                <Row label={chosen.length ? `${tr('Projects')} (${chosen.length})` : tr('Projects')}>
                  <SearchPicker
                    items={projectItems}
                    selected={selected}
                    onToggle={(id) =>
                      onSelectedChange(
                        selected.includes(id) ? selected.filter((n) => n !== id) : [...selected, id],
                      )
                    }
                    placeholder={tr('Search projects — esp32, python, rag…')}
                    label={tr('Search projects')}
                  />
                </Row>
              </div>
            </details>

            {/* Phones get the preview on demand instead of below a long form. */}
            <button
              type="button"
              className="rq-previewtoggle"
              aria-expanded={showPreview}
              aria-controls="request-preview"
              onClick={() => setShowPreview((open) => !open)}
            >
              <MailIcon />
              {showPreview ? tr('Hide preview') : tr('Show preview')}
            </button>
          </div>

          <aside className="modal__preview" id="request-preview" data-open={showPreview}>
            <div className="rq-mail">
              <div className="rq-mail__bar" aria-hidden>
                <span />
                <span />
                <span />
                <em>{tr('Preview')}</em>
              </div>
              <dl className="rq-mail__head">
                <dt>{tr('To')}</dt>
                <dd className="mono">{INQUIRY_EMAIL}</dd>
                <dt>{tr('Subject')}</dt>
                <dd>{subject}</dd>
              </dl>
              <pre className="rq-mail__body">{body}</pre>
            </div>
            <p className="rq-note">
              {mailto.length > MAILTO_LIMIT
                ? tr('Long message — use Copy draft, some mail apps truncate links.')
                : tr('Nothing is sent from here. You send it from your own mail app.')}
            </p>
          </aside>
        </div>

        <footer className="modal__foot">
          <ul className="rq-checks" aria-label={tr('Required')}>
            {checks.map((check) => (
              <li
                key={check.key}
                data-done={check.done}
                data-missing={touched && !check.done}
              >
                <span className="rq-checks__dot" aria-hidden>
                  {check.done && <CheckIcon />}
                </span>
                {check.label}
                <span className="sr-only">{check.done ? tr('done') : tr('missing')}</span>
              </li>
            ))}
          </ul>
          <div className="modal__actions">
            <button
              type="button"
              className={`btn${copied ? ' btn--copied' : ''}`}
              onClick={copyDraft}
            >
              <span className="btn__icon" key={copied ? 'done' : 'idle'}>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </span>
              {copied ? tr('Copied') : tr('Copy draft')}
            </button>
            <a
              className={`btn btn--request${ready ? '' : ' btn--disabled'}`}
              href={ready ? mailto : undefined}
              aria-disabled={!ready}
              onClick={(e) => {
                if (!ready) {
                  e.preventDefault()
                  setTouched(true)
                }
              }}
            >
              <SendIcon />
              {tr('Open in email app')}
            </a>
          </div>
        </footer>
      </div>
    </>
  )
}
