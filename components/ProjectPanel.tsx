'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatMonth, formatRelative, languageHue } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import {
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  CopyIcon,
  GitHubIcon,
  LinkIcon,
  RequestIcon,
} from './Icons'
import Readme from './Readme'
import { hasPage, projectHref } from '@/lib/projectPages'

/**
 * Copies the project's own page when it has one — that address unfurls with
 * its title and description. Private projects fall back to the current URL,
 * which already carries the open panel (`?p=Name`).
 */
function CopyLinkButton({ project }: { project: Project }) {
  const { t, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      const url = hasPage(project) ? new URL(projectHref(project, locale), location.origin).href : location.href
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked — the URL is in the address bar either way. */
    }
  }

  return (
    <button
      type="button"
      className={`btn${copied ? ' btn--copied' : ''}`}
      onClick={copy}
      title={`Copy a link that opens ${project.title}`}
    >
      {/* Keyed so the tick mounts fresh and pops rather than swapping in flat. */}
      <span className="btn__icon" key={copied ? 'done' : 'idle'}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      {copied ? t('Copied') : t('Copy link')}
    </button>
  )
}

export default function ProjectPanel({
  project,
  projects,
  onClose,
  onOpen,
  onRequest,
}: {
  project: Project
  /** The full list, in the order the site holds it — the panel steps along it. */
  projects: Project[]
  onClose: () => void
  onOpen: (name: string) => void
  /** Opens the request tab with this project already attached. */
  onRequest: (name: string) => void
}) {
  const { t, locale } = useI18n()
  const position = projects.findIndex((p) => p.name === project.name)
  const previous = position > 0 ? projects[position - 1] : null
  const next = position !== -1 && position < projects.length - 1 ? projects[position + 1] : null
  const closeRef = useRef<HTMLButtonElement>(null)

  // Width is draggable via the grip on the left edge and remembered.
  const [width, setWidth] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const stored = Number(localStorage.getItem('panel-width'))
    if (stored) setWidth(clampWidth(stored))
  }, [])

  const clampWidth = (w: number) =>
    Math.round(Math.min(Math.max(w, 400), Math.min(920, window.innerWidth - 72)))

  const applyWidth = useCallback((w: number) => {
    const clamped = clampWidth(w)
    setWidth(clamped)
    localStorage.setItem('panel-width', String(clamped))
    return clamped
  }, [])

  function onGripPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function onGripPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    applyWidth(window.innerWidth - e.clientX)
  }

  function onGripPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragging(false)
  }

  function onGripKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const current = width ?? Math.min(560, window.innerWidth)
    applyWidth(current + (e.key === 'ArrowLeft' ? 32 : -32))
  }

  // Focus moves into the panel so keyboard users land here — and again when
  // stepping to the next project, which replaces everything below the header.
  useEffect(() => {
    closeRef.current?.focus()
  }, [project.name])

  // The page behind the panel holds still for as long as it is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Escape closes; [ and ] step through the list — the arrow keys are left
  // alone because the readme scrolls under them, and so does the resize grip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A bracket typed into the topbar search is a search term, not a step.
      const typing =
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (typing) {
        return
      } else if (e.key === '[' && previous) {
        e.preventDefault()
        onOpen(previous.name)
      } else if (e.key === ']' && next) {
        e.preventDefault()
        onOpen(next.name)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, onOpen, previous, next])

  const links = [
    ...(project.html_url ? [{ label: t('Repository'), href: project.html_url, icon: <GitHubIcon size={14} /> }] : []),
    ...(project.homepage
      ? [{ label: t('Homepage'), href: project.homepage, icon: <LinkIcon /> }]
      : []),
    ...project.links.map((l) => ({ ...l, icon: <LinkIcon /> })),
  ]

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className={`panel${dragging ? ' panel--dragging' : ''}`}
        style={width ? { width: `min(${width}px, 100vw)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={t('{name} details', { name: project.title })}
      >
        <div
          className="panel__grip"
          role="separator"
          aria-orientation="vertical"
          aria-label={t('Resize panel')}
          tabIndex={0}
          data-dragging={dragging}
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          onPointerCancel={onGripPointerUp}
          onKeyDown={onGripKeyDown}
        />
        <header className="panel__head">
          {project.icon ? (
            <img className="panel__icon" src={project.icon} alt="" width={44} height={44} />
          ) : (
            <span className="panel__icon panel__icon--mono" aria-hidden>
              {project.title.charAt(0)}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="panel__title">{project.title}</h2>
            <p className="panel__sub">
              <span className="mono">{project.full_name || `arn-c0de/${project.name}`}</span>
              {' · '}
              {t(project.category)}
            </p>
          </div>
          {/* Stepping through the list without going back to the grid every
              time. Disabled at the ends rather than hidden, so the pair does
              not shift the close button around as you move along. */}
          <div className="panel__step">
            <button
              type="button"
              className="iconbtn"
              onClick={() => previous && onOpen(previous.name)}
              disabled={!previous}
              aria-label={previous ? t('Previous project: {name}', { name: previous.title }) : t('No previous project')}
              title={previous ? `${previous.title}  [` : undefined}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => next && onOpen(next.name)}
              disabled={!next}
              aria-label={next ? t('Next project: {name}', { name: next.title }) : t('No next project')}
              title={next ? `${next.title}  ]` : undefined}
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label={t('Close panel')}>
            <CloseIcon />
          </button>
        </header>

        <div className="panel__body">
          {project.description && (
            <p className="panel__desc">{project.description}</p>
          )}

          <section className="panel__section">
            <div className="panel__actions">
              <button type="button" className="btn btn--request" onClick={() => onRequest(project.name)}>
                <RequestIcon />
                {t('Ask about this')}
              </button>
              {links.map((link) => (
                <a
                  key={link.href}
                  className="btn"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
              {hasPage(project) && (
                <a className="btn" href={projectHref(project, locale)}>
                  <LinkIcon />
                  {t('Project page')}
                </a>
              )}
              <CopyLinkButton project={project} />
            </div>
          </section>

          <section className="panel__section">
            <div className="stats">
              <div className="stat">
                <div className="stat__v">{project.stargazers_count}</div>
                <div className="stat__k">{t('Stars')}</div>
              </div>
              <div className="stat">
                <div className="stat__v">{project.forks_count}</div>
                <div className="stat__k">{t('Forks')}</div>
              </div>
              <div className="stat">
                <div className="stat__v stat__v--text">
                  {formatMonth(project.created_at, locale)}
                </div>
                <div className="stat__k">{t('Created')}</div>
              </div>
              <div className="stat">
                <div className="stat__v stat__v--text">
                  {formatRelative(project.pushed_at, locale)}
                </div>
                <div className="stat__k">{t('Last push')}</div>
              </div>
            </div>
          </section>

          <section className="panel__section">
            <p className="panel__label">{t('Details')}</p>
            <dl className="deflist">
              {project.language && (
                <>
                  <dt>{t('Language')}</dt>
                  <dd>
                    <span
                      className="lang"
                      style={{ '--hue': languageHue(project.language) } as React.CSSProperties}
                    >
                      <span className="lang__dot" />
                      {project.language}
                    </span>
                  </dd>
                </>
              )}
              <dt>{t('License')}</dt>
              {/* GitHub reports NOASSERTION for licences it cannot identify. */}
              <dd>
                {!project.license || project.license === 'NOASSERTION'
                  ? t('see repository')
                  : project.license}
              </dd>
              {project.topics.length > 0 && (
                <>
                  <dt>{t('Topics')}</dt>
                  <dd>
                    <span className="tagrow">
                      {project.topics.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </span>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className="panel__section">
            <p className="panel__label">{t('Readme')}</p>
            <Readme key={project.name} project={project} />
          </section>
        </div>
      </aside>
    </>
  )
}
