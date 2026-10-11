'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import timeline, {
  type Localized,
  type TimelineEntry,
  type TimelineImage,
  type TimelineStatus,
} from '@/timeline.config'
import { asset } from '@/lib/basePath'
import { useI18n, type Locale } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import { ArrowIcon, CheckIcon, CloseIcon, LinkIcon } from './Icons'

const ORDER: TimelineStatus[] = ['planned', 'now', 'done']

const STATUS_LABEL: Record<TimelineStatus, string> = {
  planned: 'Planned',
  now: 'In progress',
  done: 'Done',
}

function pick(value: Localized | undefined, locale: Locale): string {
  if (value === undefined) return ''
  return typeof value === 'string' ? value : value[locale]
}

/** 'YYYY-MM' → "Oct 2026", 'YYYY-MM-DD' → "11 Oct 2026", in the page language. */
export function formatTimelineDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m) return date
  const value = new Date(Date.UTC(y, m - 1, d || 1))
  return value.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    timeZone: 'UTC',
    ...(d ? { day: 'numeric' } : {}),
    month: 'short',
    year: 'numeric',
  })
}

/** Planned first, then in progress, then done; newest first inside each. */
export function sortTimeline(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const status = ORDER.indexOf(a.entry.status) - ORDER.indexOf(b.entry.status)
      if (status !== 0) return status
      const dateA = a.entry.date ?? ''
      const dateB = b.entry.date ?? ''
      if (dateA !== dateB) return dateA < dateB ? 1 : -1
      return a.index - b.index
    })
    .map(({ entry }) => entry)
}

export default function TimelinePane({
  projects,
  onOpenProject,
}: {
  projects: Project[]
  onOpenProject: (name: string) => void
}) {
  const { t, locale, labels } = useI18n()
  const [filter, setFilter] = useState<TimelineStatus | 'all'>('all')
  const [zoomed, setZoomed] = useState<TimelineImage | null>(null)

  const sorted = useMemo(() => sortTimeline(timeline), [])
  const known = useMemo(() => new Set(projects.map((p) => p.name)), [projects])
  const counts = useMemo(() => {
    const c: Record<TimelineStatus, number> = { planned: 0, now: 0, done: 0 }
    for (const e of timeline) c[e.status] += 1
    return c
  }, [])

  const groups = ORDER.filter((s) => filter === 'all' || filter === s)
    .map((status) => ({ status, entries: sorted.filter((e) => e.status === status) }))
    .filter((g) => g.entries.length > 0)

  return (
    <div className="pane timeline">
      <div className="pane__head">
        <h1 className="pane__title">{labels.timeline}</h1>
        <p className="pane__lede">{t('TIMELINE_LEDE')}</p>
      </div>

      <div className="chips" role="group" aria-label={t('Filter by status')}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {t('All')}
          <span className="chip__n">{timeline.length}</span>
        </button>
        {ORDER.filter((s) => counts[s] > 0).map((status) => (
          <button
            key={status}
            type="button"
            className="chip"
            aria-pressed={filter === status}
            onClick={() => setFilter(filter === status ? 'all' : status)}
          >
            <span className={`tl-dot tl-dot--${status}`} aria-hidden />
            {t(STATUS_LABEL[status])}
            <span className="chip__n">{counts[status]}</span>
          </button>
        ))}
      </div>

      {groups.map(({ status, entries }) => (
        <section key={status} className={`tl-group tl-group--${status}`}>
          <h2 className="tl-group__title">
            <span className={`tl-dot tl-dot--${status}`} aria-hidden />
            {t(STATUS_LABEL[status])}
          </h2>

          <ol className="tl-list">
            {entries.map((entry, i) => (
              <Entry
                key={entry.id}
                entry={entry}
                index={i}
                locale={locale}
                canOpen={!!entry.project && known.has(entry.project)}
                onOpenProject={onOpenProject}
                onZoom={setZoomed}
              />
            ))}
          </ol>
        </section>
      ))}

      {zoomed && <Lightbox image={zoomed} locale={locale} onClose={() => setZoomed(null)} />}
    </div>
  )
}

function Entry({
  entry,
  index,
  locale,
  canOpen,
  onOpenProject,
  onZoom,
}: {
  entry: TimelineEntry
  index: number
  locale: Locale
  canOpen: boolean
  onOpenProject: (name: string) => void
  onZoom: (image: TimelineImage) => void
}) {
  const { t } = useI18n()
  const images = entry.images ?? []
  // A layout that needs pictures falls back to plain text without them.
  const layout = images.length === 0 ? 'text' : (entry.layout ?? 'image-right')
  const when = entry.when ? pick(entry.when, locale) : entry.date ? formatTimelineDate(entry.date, locale) : ''

  const figure = (image: TimelineImage | undefined, slot: string) =>
    image ? <Figure key={slot} image={image} locale={locale} slot={slot} onZoom={onZoom} /> : null

  const body = (
    <div className="tl-body">
      <h3 className="tl-title">{pick(entry.title, locale)}</h3>
      <p className="tl-text">{pick(entry.text, locale)}</p>
      {(entry.tags?.length || canOpen || entry.links?.length) && (
        <div className="tl-foot">
          {entry.tags?.length ? (
            <span className="tagrow">
              {entry.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
          <span className="tl-actions">
            {entry.links?.map((link) => (
              <a key={link.href} className="tl-link" href={link.href} target="_blank" rel="noopener noreferrer">
                <LinkIcon />
                {pick(link.label, locale)}
              </a>
            ))}
            {canOpen && (
              <button type="button" className="tl-link" onClick={() => onOpenProject(entry.project!)}>
                {t('Open project')}
                <ArrowIcon />
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  )

  let content: React.ReactNode
  switch (layout) {
    case 'image-left':
      content = [figure(images[0], 'a'), body]
      break
    case 'image-right':
      content = [body, figure(images[0], 'a')]
      break
    case 'images-sides':
      content = [figure(images[0], 'a'), body, figure(images[1] ?? images[0], 'b')]
      break
    case 'image-center':
      content = [
        body,
        figure(images[0], 'a'),
        <div key="aside" className="tl-body tl-body--aside">
          <p className="tl-text">{pick(entry.aside, locale)}</p>
        </div>,
      ]
      break
    case 'gallery':
      content = [
        body,
        <div key="gallery" className="tl-gallery" data-count={Math.min(images.length, 4)}>
          {images.slice(0, 4).map((image, i) => figure(image, `g${i}`))}
        </div>,
      ]
      break
    default:
      content = body
  }

  return (
    <li
      className={`tl-entry tl-entry--${entry.status}`}
      id={`tl-${entry.id}`}
      data-reveal
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="tl-rail" aria-hidden>
        <span className={`tl-node tl-node--${entry.status}`}>
          {entry.status === 'done' && <CheckIcon />}
        </span>
      </div>
      <div className="tl-main">
        {when && (
          <p className="tl-when">
            <time dateTime={entry.date}>{when}</time>
          </p>
        )}
        <article className={`tl-card tl-card--${layout}`}>{content}</article>
      </div>
    </li>
  )
}

function Figure({
  image,
  locale,
  slot,
  onZoom,
}: {
  image: TimelineImage
  locale: Locale
  slot: string
  onZoom: (image: TimelineImage) => void
}) {
  const { t } = useI18n()
  const alt = pick(image.alt, locale)
  const caption = pick(image.caption, locale)
  return (
    <figure className={`tl-figure tl-figure--${slot.startsWith('g') ? 'g' : slot}`} data-fit={image.fit ?? 'cover'}>
      <button type="button" className="tl-figure__zoom" onClick={() => onZoom(image)} aria-label={t('Enlarge image: {alt}', { alt })}>
        <img src={asset(image.src)} alt={alt} loading="lazy" decoding="async" />
      </button>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/** Full-size view of one picture. Escape, the button or the backdrop closes it. */
function Lightbox({ image, locale, onClose }: { image: TimelineImage; locale: Locale; onClose: () => void }) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)
  const latest = useRef(onClose)
  latest.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        latest.current()
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previousFocus?.focus()
    }
  }, [])

  const alt = pick(image.alt, locale)
  const caption = pick(image.caption, locale)
  // Portalled to <body>: the pane is animated, and a transformed ancestor
  // would pin a position: fixed overlay to the pane instead of the window.
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button ref={closeRef} type="button" className="iconbtn lightbox__close" aria-label={t('Close image')} onClick={onClose}>
        <CloseIcon />
      </button>
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={asset(image.src)} alt={alt} />
        {(caption || alt) && <figcaption>{caption || alt}</figcaption>}
      </figure>
    </div>,
    document.body,
  )
}
