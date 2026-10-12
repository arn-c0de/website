'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  plannedNote,
  type Localized,
  type TimelineEntry,
  type TimelineImage,
  type TimelineMedia,
  type TimelineStatus,
  type TimelineVideoFile,
  type TimelineYouTube,
} from '@/timeline.config'
import { asset } from '@/lib/basePath'
import { FEED_PATH } from '@/lib/feed'
import { useI18n, type Locale } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import { usePrefersReducedMotion } from '@/lib/useMotion'
import {
  ageRestriction,
  allTimelineEntries,
  entryHasPage,
  entryPath,
  formatTimelineDate,
  hasVideo,
  pick,
  sortTimeline,
} from '@/lib/timeline'
import { youtubeEmbedUrl, youtubeId, youtubeStart, youtubeWatchUrl } from '@/lib/video'
import { ArrowIcon, CheckIcon, CloseIcon, HandIcon, LinkIcon, PlayIcon } from './Icons'

const ORDER: TimelineStatus[] = ['planned', 'now', 'done']

const STATUS_LABEL: Record<TimelineStatus, string> = {
  planned: 'Planned',
  now: 'In progress',
  done: 'Done',
}

export default function TimelinePane({
  projects,
  onOpenProject,
}: {
  projects: Project[]
  onOpenProject: (name: string) => void
}) {
  const { t, locale, labels } = useI18n()
  const [filter, setFilter] = useState<TimelineStatus | 'all' | 'video'>('all')
  const [project, setProject] = useState('all')
  const [year, setYear] = useState('all')
  const [zoomed, setZoomed] = useState<TimelineImage | null>(null)

  // Hand-written entries plus the channel's videos, fetched at build time.
  const all = useMemo(() => allTimelineEntries(projects), [projects])
  const sorted = useMemo(() => sortTimeline(all), [all])
  const known = useMemo(() => new Set(projects.map((p) => p.name)), [projects])
  const icons = useMemo(() => new Map(projects.map((p) => [p.name, p.icon])), [projects])
  const titles = useMemo(() => new Map(projects.map((p) => [p.name, p.title])), [projects])

  // Projects and years that actually appear, for the two dropdowns.
  const projectOptions = useMemo(() => {
    const names = [...new Set(all.map((e) => e.project).filter((n): n is string => !!n))]
    return names
      .map((name) => ({ name, label: titles.get(name) || name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [all, titles])
  const years = useMemo(
    () => [...new Set(all.map((e) => e.date?.slice(0, 4)).filter((y): y is string => !!y))].sort().reverse(),
    [all],
  )

  // Project and year narrow everything; the status chips count what is left.
  const scoped = useMemo(
    () =>
      sorted.filter(
        (e) => (project === 'all' || e.project === project) && (year === 'all' || e.date?.startsWith(year)),
      ),
    [sorted, project, year],
  )
  const counts = useMemo(() => {
    const c: Record<TimelineStatus, number> = { planned: 0, now: 0, done: 0 }
    for (const e of scoped) c[e.status] += 1
    return c
  }, [scoped])
  const videoCount = useMemo(() => scoped.filter(hasVideo).length, [scoped])
  const narrowed = project !== 'all' || year !== 'all'

  const visible = filter === 'video' ? scoped.filter(hasVideo) : scoped
  const groups = ORDER.filter((s) => filter === 'all' || filter === 'video' || filter === s)
    .map((status) => ({ status, entries: visible.filter((e) => e.status === status) }))
    .filter((g) => g.entries.length > 0)

  return (
    <div className="pane timeline">
      <div className="pane__head">
        <h1 className="pane__title">{labels.timeline}</h1>
        <p className="pane__lede">
          {t('TIMELINE_LEDE')}{' '}
          <a className="tl-feed" href={asset(FEED_PATH[locale])} type="application/atom+xml">
            {t('Follow it as a feed')}
          </a>
        </p>
      </div>

      {(projectOptions.length > 1 || years.length > 1) && (
        <div className="toolbar tl-toolbar">
          {projectOptions.length > 1 && (
            <select
              className="select"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              aria-label={t('Filter by project')}
            >
              <option value="all">{t('All projects')}</option>
              {projectOptions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
          {years.length > 1 && (
            <select
              className="select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              aria-label={t('Filter by year')}
            >
              <option value="all">{t('All years')}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {narrowed && (
            <button
              type="button"
              className="tl-link tl-toolbar__reset"
              onClick={() => {
                setProject('all')
                setYear('all')
              }}
            >
              <CloseIcon />
              {t('Reset filters')}
            </button>
          )}
        </div>
      )}

      <div className="chips" role="group" aria-label={t('Filter by status')}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {t('All')}
          <span className="chip__n">{scoped.length}</span>
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
        {videoCount > 0 && (
          <button
            type="button"
            className="chip"
            aria-pressed={filter === 'video'}
            onClick={() => setFilter(filter === 'video' ? 'all' : 'video')}
          >
            <PlayIcon />
            {t('Videos')}
            <span className="chip__n">{videoCount}</span>
          </button>
        )}
      </div>

      {groups.length === 0 && <p className="tl-empty">{t('No entries match these filters.')}</p>}

      {groups.map(({ status, entries }) => (
        <section key={status} className={`tl-group tl-group--${status}`}>
          <h2 className="tl-group__title">
            <span className={`tl-dot tl-dot--${status}`} aria-hidden />
            {t(STATUS_LABEL[status])}
          </h2>
          {status === 'planned' && pick(plannedNote, locale) && (
            <p className="tl-group__note">{pick(plannedNote, locale)}</p>
          )}

          <ol className="tl-list">
            {entries.map((entry, i) => {
              // Done entries span years; a marker where the year changes keeps
              // a long list scannable. The first year is the section itself.
              const year = entry.date?.slice(0, 4)
              const previous = entries[i - 1]?.date?.slice(0, 4)
              const marker = status === 'done' && i > 0 && year && previous && year !== previous
              return [
                marker ? (
                  <li key={`year-${year}`} className="tl-year">
                    <span className="tl-year__rail" aria-hidden />
                    <span className="tl-year__label">{year}</span>
                  </li>
                ) : null,
                <Entry
                  key={entry.id}
                  entry={entry}
                  index={i}
                  locale={locale}
                  canOpen={!!entry.project && known.has(entry.project)}
                  icon={entry.project ? (icons.get(entry.project) ?? null) : null}
                  onOpenProject={onOpenProject}
                  onZoom={setZoomed}
                />,
              ]
            })}
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
  icon,
  onOpenProject,
  onZoom,
}: {
  entry: TimelineEntry
  index: number
  locale: Locale
  canOpen: boolean
  /** The linked project's icon, shown before the title. */
  icon: string | null
  onOpenProject: (name: string) => void
  onZoom: (image: TimelineImage) => void
}) {
  const { t } = useI18n()
  const images: TimelineMedia[] = entry.media ?? entry.images ?? []
  // A layout that needs pictures falls back to plain text without them.
  const layout = images.length === 0 ? 'text' : (entry.layout ?? 'image-right')
  const when = entry.when ? pick(entry.when, locale) : entry.date ? formatTimelineDate(entry.date, locale) : ''

  const figure = (item: TimelineMedia | undefined, slot: string) => {
    if (!item) return null
    if ('youtube' in item) return <YouTubeFigure key={slot} video={item} locale={locale} slot={slot} />
    if ('video' in item) return <VideoFigure key={slot} video={item} locale={locale} slot={slot} />
    return <Figure key={slot} image={item} locale={locale} slot={slot} onZoom={onZoom} />
  }

  const body = (
    <div className="tl-body">
      <h3 className="tl-title">
        {icon && <img className="tl-title__icon" src={icon} alt="" width={28} height={28} />}
        {pick(entry.title, locale)}
      </h3>
      {pick(entry.text, locale) && <p className="tl-text">{pick(entry.text, locale)}</p>}
      {entry.help && <HelpWanted help={entry.help} locale={locale} />}
      {(entry.tags?.length || canOpen || entry.links?.length || entryHasPage(entry)) && (
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
            {entryHasPage(entry) && (
              <a className="tl-link" href={asset(entryPath(entry.id))}>
                {t('Read post')}
              </a>
            )}
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

export function Figure({
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
    <figure className={slotClass(slot)} data-fit={image.fit ?? 'cover'}>
      <button type="button" className="tl-figure__zoom" onClick={() => onZoom(image)} aria-label={t('Enlarge image: {alt}', { alt })}>
        <img src={asset(image.src)} alt={alt} loading="lazy" decoding="async" />
      </button>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/** "Help wanted" box: the areas as chips and a button to offer help. */
export function HelpWanted({ help, locale }: { help: NonNullable<TimelineEntry['help']>; locale: Locale }) {
  const { t } = useI18n()
  return (
    <div className="help">
      <span className="help__label">
        <HandIcon />
        {t('Help wanted')}
      </span>
      <span className="help__areas">
        {help.areas.map((area) => (
          <span key={pick(area, 'en')} className="help__area">
            {pick(area, locale)}
          </span>
        ))}
      </span>
      <a className="help__cta" href={help.href} target="_blank" rel="noopener noreferrer">
        {t('Help out')}
        <ArrowIcon />
      </a>
    </div>
  )
}

const slotClass = (slot: string) => `tl-figure tl-figure--${slot.startsWith('g') ? 'g' : slot}`

/**
 * A YouTube video behind a click: until it is pressed the page makes no
 * request to YouTube at all — no thumbnail, no script — which is what the
 * privacy note promises. Pressing play swaps in the youtube-nocookie player.
 */
export function YouTubeFigure({ video, locale, slot }: { video: TimelineYouTube; locale: Locale; slot: string }) {
  const { t } = useI18n()
  const [playing, setPlaying] = useState(false)
  // An 18+ video's still stays blurred until the visitor asks to see it.
  const [revealed, setRevealed] = useState(false)
  const id = youtubeId(video.youtube)
  const start = youtubeStart(video.youtube)
  const title = pick(video.title, locale)
  const caption = pick(video.caption, locale)
  // YouTube refuses 18+ videos in an embedded player, so those link out.
  const restricted = ageRestriction(video)
  if (!id) return null
  const veiled = restricted !== null && !!video.poster && !revealed

  const label = (
    <>
      {video.poster && <img src={asset(video.poster)} alt="" loading="lazy" decoding="async" />}
      {restricted && <span className="tl-video__age">18+</span>}
      <span className="tl-video__play" aria-hidden>
        <PlayIcon />
      </span>
      <span className="tl-video__label">
        <strong>{title}</strong>
        <span>{restricted ? t('Age-restricted: plays on YouTube') : t('Loads from YouTube when you press play')}</span>
      </span>
    </>
  )

  return (
    <figure className={`${slotClass(slot)} tl-video`} data-kind="youtube" data-age={restricted ? '18' : undefined}>
      <div className="tl-video__frame">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(id, start)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : veiled ? (
          <div className="tl-video__facade tl-video__veil">
            <img src={asset(video.poster!)} alt="" loading="lazy" decoding="async" data-sensitive />
            <span className="tl-video__age">18+</span>
            <span className="tl-video__veil-text">
              <strong>{pick(restricted!, locale)}</strong>
              <button type="button" className="btn btn--sm" onClick={() => setRevealed(true)}>
                {t('Show preview')}
              </button>
            </span>
          </div>
        ) : restricted ? (
          <a
            className="tl-video__facade"
            href={youtubeWatchUrl(id, start)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Watch on YouTube (18+): {title}', { title })}
          >
            {label}
          </a>
        ) : (
          <button
            type="button"
            className="tl-video__facade"
            onClick={() => setPlaying(true)}
            aria-label={t('Play video: {title}', { title })}
          >
            {label}
          </button>
        )}
      </div>
      <figcaption className="tl-video__meta">
        {restricted ? <span>{pick(restricted, locale)}</span> : caption && <span>{caption}</span>}
        <a href={youtubeWatchUrl(id, start)} target="_blank" rel="noopener noreferrer">
          {t('Watch on YouTube')}
          <ArrowIcon />
        </a>
      </figcaption>
    </figure>
  )
}

/** A video file from this site. `loop` makes it a silent preview clip. */
export function VideoFigure({ video, locale, slot }: { video: TimelineVideoFile; locale: Locale; slot: string }) {
  const reduced = usePrefersReducedMotion()
  const title = pick(video.title, locale)
  const caption = pick(video.caption, locale)
  // A looping preview only plays by itself when motion is welcome; otherwise
  // it gets the normal controls and waits.
  const preview = video.loop && !reduced
  return (
    <figure className={`${slotClass(slot)} tl-video`} data-kind="file">
      <div className="tl-video__frame">
        <video
          src={asset(video.video)}
          poster={video.poster ? asset(video.poster) : undefined}
          title={title}
          aria-label={title}
          preload="metadata"
          playsInline
          controls={!preview}
          {...(preview ? { autoPlay: true, muted: true, loop: true } : {})}
        />
      </div>
      {caption && (
        <figcaption className="tl-video__meta">
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  )
}

/** Full-size view of one picture. Escape, the button or the backdrop closes it. */
export function Lightbox({ image, locale, onClose }: { image: TimelineImage; locale: Locale; onClose: () => void }) {
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
