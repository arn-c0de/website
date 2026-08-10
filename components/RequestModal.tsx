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
import type { Project } from '@/lib/types'
import SearchPicker, { type PickerItem } from './SearchPicker'
import { CheckIcon, CloseIcon, CopyIcon, RequestIcon, SendIcon } from './Icons'

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<InquiryTypeId>('question')
  const [areas, setAreas] = useState<ServiceAreaId[]>([])
  const [timeline, setTimeline] = useState<RequestDraft['timeline']>(TIMELINES[0])
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const chosen = useMemo(
    () => selected.map((n) => projects.find((p) => p.name === n)).filter(Boolean) as Project[],
    [selected, projects],
  )

  const areaItems: PickerItem[] = useMemo(
    () => SERVICE_AREAS.map((a) => ({ id: a.id, title: a.title, keywords: a.keywords })),
    [],
  )

  /** Searching projects by language, topic or blurb beats scrolling a list. */
  const projectItems: PickerItem[] = useMemo(
    () =>
      projects.map((p) => ({
        id: p.name,
        title: p.title,
        keywords: [p.name, p.description ?? '', p.language ?? '', p.category, ...p.topics].join(' '),
        meta: p.language ?? undefined,
      })),
    [projects],
  )

  const draft: RequestDraft = { name, email, type, areas, timeline, message, projects: chosen }
  const subject = buildSubject(draft)
  const body = buildBody(draft)
  const mailto = buildMailto(draft)

  const missing: string[] = []
  if (!name.trim()) missing.push('name')
  if (!looksLikeEmail(email)) missing.push('email')
  if (!message.trim()) missing.push('message')
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

  function toggleArea(id: ServiceAreaId) {
    setAreas((current) => {
      if (id === 'unsure') return current.includes(id) ? [] : [id]

      const specific = current.filter((area) => area !== 'unsure')
      return specific.includes(id) ? specific.filter((area) => area !== id) : [...specific, id]
    })
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`To: ${INQUIRY_EMAIL}\nSubject: ${subject}\n\n${body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard blocked — the preview is selectable. */
    }
  }

  return (
    <>
      <div className="scrim" style={{ zIndex: 55 }} onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Start a request">
        <header className="modal__head">
          <span className="modal__mark" aria-hidden>
            <RequestIcon />
          </span>
          <div className="modal__heading">
            <h2 className="modal__title">Start a request</h2>
            <p className="modal__sub">
              Pick what it is about — you get a finished email to send yourself.
            </p>
          </div>
          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className="modal__cols">
          <div className="modal__form">
            <Row label="Type">
              <div className="chips chips--tight">
                {INQUIRY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="chip chip--sm"
                    aria-pressed={type === t.id}
                    onClick={() => setType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Row>

            <Row label={areas.length ? `Areas (${areas.length})` : 'Areas'}>
              <SearchPicker
                items={areaItems}
                selected={areas}
                onToggle={(id) => toggleArea(id as ServiceAreaId)}
                placeholder="Search areas — lora, pcap, kotlin…"
                label="Search areas"
              />
            </Row>

            <Row label={chosen.length ? `Projects (${chosen.length})` : 'Projects'}>
              <SearchPicker
                items={projectItems}
                selected={selected}
                onToggle={(id) =>
                  onSelectedChange(
                    selected.includes(id) ? selected.filter((n) => n !== id) : [...selected, id],
                  )
                }
                placeholder="Search projects — esp32, python, rag…"
                label="Search projects"
              />
            </Row>

            <Row label="Name">
              <input
                className="input input--sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </Row>

            <Row label="Email">
              <input
                className="input input--sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </Row>

            <Row label="When">
              <select
                className="select select--wide select--sm"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value as RequestDraft['timeline'])}
                aria-label="Timeline"
              >
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Row>

            <Row label="Message">
              <textarea
                className="input input--area input--sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={4}
                placeholder="What are you trying to build, and where do you need help?"
              />
            </Row>
          </div>

          <aside className="modal__preview">
            <span className="fset__label">Preview</span>
            <div className="draft draft--tight">
              <div className="draft__head">
                <span>
                  <span className="draft__key">To</span>
                  <span className="mono">{INQUIRY_EMAIL}</span>
                </span>
                <span>
                  <span className="draft__key">Subject</span>
                  {subject}
                </span>
              </div>
              <pre className="draft__body">{body}</pre>
            </div>
          </aside>
        </div>

        <footer className="modal__foot">
          <span className="modal__hint">
            {touched && !ready ? (
              <span className="modal__hint--warn">Still needed: {missing.join(', ')}</span>
            ) : mailto.length > MAILTO_LIMIT ? (
              'Long message — use Copy draft, some mail apps truncate links.'
            ) : (
              'Nothing is sent from here. You send it from your own mail app.'
            )}
          </span>
          <div className="modal__actions">
            <button
              type="button"
              className={`btn${copied ? ' btn--copied' : ''}`}
              onClick={copyDraft}
            >
              <span className="btn__icon" key={copied ? 'done' : 'idle'}>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </span>
              {copied ? 'Copied' : 'Copy draft'}
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
              Open in email app
            </a>
          </div>
        </footer>
      </div>
    </>
  )
}
