'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadReadme } from '@/lib/github'
import { formatMonth, formatRelative, languageHue } from '@/lib/format'
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

/**
 * GitHub already sanitises the HTML it renders, but this runs it through the
 * browser's parser once more and drops anything executable before it is
 * inserted. Cheap, and it means a compromised upstream response cannot run.
 *
 * Images are also defused: readmes embed badges and screenshots hosted on
 * githubusercontent.com, and loading those automatically would contact a third
 * party the visitor never asked about. The URL is parked in `data-src` and only
 * becomes a real request when the visitor asks for it.
 */
function sanitise(html: string, repo: string): { withImages: string; withoutImages: string; images: number } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form, link, meta').forEach((el) =>
    el.remove(),
  )
  // GitHub injects a permalink anchor into every heading; it renders as a
  // stray link glyph outside of GitHub's own stylesheet.
  doc.querySelectorAll('a.anchor, svg.octicon-link').forEach((el) => el.remove())

  // Readmes reference sibling files by relative path. GitHub leaves those
  // alone, so they would resolve against this domain and 404.
  const RAW = `https://raw.githubusercontent.com/arn-c0de/${repo}/HEAD/`
  const BLOB = `https://github.com/arn-c0de/${repo}/blob/HEAD/`
  const isAbsolute = (url: string) => /^(https?:|data:|mailto:|#)/i.test(url)

  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      if (name === 'href' || name === 'src') {
        // Browsers strip whitespace and control characters out of a scheme
        // before acting on it, so `java\tscript:` runs just like `javascript:`.
        // Collapse those out before checking, and block every scheme that can
        // execute or smuggle markup — not just `javascript:`.
        const scheme = attr.value.replace(/[\u0000- ]+/g, '').toLowerCase()
        if (/^(javascript|vbscript|data):/.test(scheme)) el.removeAttribute(attr.name)
      }
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (href && !isAbsolute(href)) el.setAttribute('href', BLOB + href.replace(/^\.?\//, ''))
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src')
      if (src && !isAbsolute(src)) el.setAttribute('src', RAW + src.replace(/^\.?\//, ''))
      el.removeAttribute('srcset')
      el.setAttribute('loading', 'lazy')
    }
  })

  const images = doc.querySelectorAll('img')
  const withImages = doc.body.innerHTML

  // Second pass: park every image URL so nothing is requested until asked for.
  images.forEach((img) => {
    img.setAttribute('data-src', img.getAttribute('src') ?? '')
    img.removeAttribute('src')
  })

  return { withImages, withoutImages: doc.body.innerHTML, images: images.length }
}

/**
 * The address bar already carries the open project (`?p=Name`), so sharing a
 * project is just handing over the current URL.
 */
function CopyLinkButton({ project }: { project: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href)
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
      title={`Copy a link that opens ${project}`}
    >
      {/* Keyed so the tick mounts fresh and pops rather than swapping in flat. */}
      <span className="btn__icon" key={copied ? 'done' : 'idle'}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      {copied ? 'Copied' : 'Copy link'}
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
  const position = projects.findIndex((p) => p.name === project.name)
  const previous = position > 0 ? projects[position - 1] : null
  const next = position !== -1 && position < projects.length - 1 ? projects[position + 1] : null
  const [readme, setReadme] = useState<{ withImages: string; withoutImages: string; images: number } | null>(null)
  const [readmeState, setReadmeState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [imagesShown, setImagesShown] = useState(false)
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

  useEffect(() => {
    if (project.isPrivate) {
      setReadmeState('missing')
      setReadme(null)
      return
    }
    const controller = new AbortController()
    setReadmeState('loading')
    setReadme(null)
    setImagesShown(false)
    loadReadme(project.name, controller.signal).then((html) => {
      if (controller.signal.aborted) return
      if (html) {
        setReadme(sanitise(html, project.name))
        setReadmeState('ready')
      } else {
        setReadmeState('missing')
      }
    })
    return () => controller.abort()
  }, [project.name])

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
    ...(project.html_url ? [{ label: 'Repository', href: project.html_url, icon: <GitHubIcon size={14} /> }] : []),
    ...(project.homepage
      ? [{ label: 'Homepage', href: project.homepage, icon: <LinkIcon /> }]
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
        aria-label={`${project.title} details`}
      >
        <div
          className="panel__grip"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          tabIndex={0}
          data-dragging={dragging}
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          onPointerCancel={onGripPointerUp}
          onKeyDown={onGripKeyDown}
        />
        <header className="panel__head">
          {project.icon && (
            <img className="panel__icon" src={project.icon} alt="" width={36} height={36} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="panel__title">{project.title}</h2>
            <p className="panel__sub">
              <span className="mono">{project.full_name || `arn-c0de/${project.name}`}</span>
              {' · '}
              {project.category}
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
              aria-label={previous ? `Previous project: ${previous.title}` : 'No previous project'}
              title={previous ? `${previous.title}  [` : undefined}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => next && onOpen(next.name)}
              disabled={!next}
              aria-label={next ? `Next project: ${next.title}` : 'No next project'}
              title={next ? `${next.title}  ]` : undefined}
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label="Close panel">
            <CloseIcon />
          </button>
        </header>

        <div className="panel__body">
          {project.description && (
            <p style={{ marginTop: 0, marginBottom: 20, color: 'var(--text-muted)' }}>
              {project.description}
            </p>
          )}

          <section className="panel__section">
            <div className="panel__actions">
              <button type="button" className="btn btn--request" onClick={() => onRequest(project.name)}>
                <RequestIcon />
                Ask about this
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
              <CopyLinkButton project={project.title} />
            </div>
          </section>

          <section className="panel__section">
            <div className="stats">
              <div className="stat">
                <div className="stat__v">{project.stargazers_count}</div>
                <div className="stat__k">stars</div>
              </div>
              <div className="stat">
                <div className="stat__v">{project.forks_count}</div>
                <div className="stat__k">forks</div>
              </div>
              <div className="stat">
                <div className="stat__v" style={{ fontSize: 14 }}>
                  {formatMonth(project.created_at)}
                </div>
                <div className="stat__k">created</div>
              </div>
              <div className="stat">
                <div className="stat__v" style={{ fontSize: 14 }}>
                  {formatRelative(project.pushed_at)}
                </div>
                <div className="stat__k">last push</div>
              </div>
            </div>
          </section>

          <section className="panel__section">
            <p className="panel__label">Details</p>
            <dl className="deflist">
              {project.language && (
                <>
                  <dt>Language</dt>
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
              <dt>License</dt>
              {/* GitHub reports NOASSERTION for licences it cannot identify. */}
              <dd>
                {!project.license || project.license === 'NOASSERTION'
                  ? 'see repository'
                  : project.license}
              </dd>
              {project.topics.length > 0 && (
                <>
                  <dt>Topics</dt>
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
            <p className="panel__label">Readme</p>
            {readmeState === 'loading' && (
              <div className="skeleton" style={{ height: 160 }} aria-label="Loading readme" />
            )}
            {readmeState === 'missing' && (
              <p style={{ color: 'var(--text-faint)', fontSize: 13.5, margin: 0 }}>
                {project.isPrivate
                  ? 'This is a private project. Use “Ask about this” to request access, an early build or further details.'
                  : 'Readme could not be loaded — open the repository on GitHub instead.'}
              </p>
            )}
            {readmeState === 'ready' && readme && (
              <>
                {readme.images > 0 && !imagesShown && (
                  <div className="callout" style={{ marginBottom: 14 }}>
                    This readme embeds{' '}
                    <strong>
                      {readme.images} image{readme.images === 1 ? '' : 's'}
                    </strong>{' '}
                    hosted by GitHub. They stay blocked until you ask for them, so nothing is
                    requested from a third party without your say-so.
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="btn" onClick={() => setImagesShown(true)}>
                        Load images
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className={`readme${imagesShown ? '' : ' readme--noimg'}`}
                  dangerouslySetInnerHTML={{
                    __html: imagesShown ? readme.withImages : readme.withoutImages,
                  }}
                />
              </>
            )}
          </section>
        </div>
      </aside>
    </>
  )
}
