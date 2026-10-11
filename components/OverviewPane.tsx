'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { asset } from '@/lib/basePath'
import { formatRelative } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import { allTimelineEntries, entryVisual, formatTimelineDate, hasVideo, latestEntries, pick } from '@/lib/timeline'
import type { Tab } from '@/lib/useAppState'
import Metric from './Metric'
import ProjectCard from './ProjectCard'
import { HelpWanted } from './TimelinePane'
import { qlinkHelp } from '@/timeline.config'
import SocialLinks from './SocialLinks'
import { YOUTUBE } from '@/lib/socials'
import {
  AboutIcon,
  ArrowIcon,
  ChevronIcon,
  GitHubIcon,
  LanguageIcon,
  MailIcon,
  PlayIcon,
  RequestIcon,
  StackIcon,
  TimelineIcon,
  YouTubeIcon,
} from './Icons'

/** Languages named in the stack tile — a taste, not the full list. */
const TOP_LANGUAGES = 4
/** Cards in the gallery; the projects tab holds the rest. Keep it above the
 *  length of `featured`, or the top-up below never runs. */
const GALLERY_SIZE = 12

export default function OverviewPane({
  projects,
  onNavigate,
  onOpenProject,
  onStartRequest,
  onOpenTimeline,
}: {
  projects: Project[]
  onNavigate: (tab: Tab) => void
  onOpenProject: (name: string) => void
  onStartRequest: () => void
  /** Opens the timeline tab at one entry. */
  onOpenTimeline: (id?: string) => void
}) {
  const { t, locale, labels } = useI18n()
  const timelineEntries = useMemo(() => allTimelineEntries(projects), [projects])
  const latest = useMemo(() => latestEntries(timelineEntries, 3), [timelineEntries])
  const stats = useMemo(() => {
    const languages = new Map<string, number>()
    let stars = 0
    let lastPush = ''

    for (const p of projects) {
      stars += p.stargazers_count
      if (p.pushed_at > lastPush) lastPush = p.pushed_at
      if (p.language) languages.set(p.language, (languages.get(p.language) ?? 0) + 1)
    }

    return {
      stars,
      lastPush,
      languages: [...languages.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    }
  }, [projects])

  // The gallery leads with the curated set and tops it up with the rest by
  // stars, so it never looks thin while the config is still short.
  const gallery = useMemo(() => {
    const featured = projects.filter((p) => p.featured)
    const rest = projects
      .filter((p) => !p.featured)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
    return [...featured, ...rest].slice(0, GALLERY_SIZE)
  }, [projects])

  return (
    <div className="pane over">
      <section className="hero">
        <div className="hero__text">
          <div className="hero__id">
            <img
              className="hero__avatar"
              src={asset('/avatar-large.jpg')}
              alt=""
              width={56}
              height={56}
            />
            <div>
              <p className="hero__handle">arn-c0de</p>
              <p className="hero__tagline">
                {t('Embedded systems, security tooling and local AI')}
              </p>
            </div>
          </div>

          <h1 className="hero__name">{t('Software from firmware to app.')}</h1>
          <p className="hero__lede">{t('HERO_LEDE')}</p>

          <div className="hero__actions">
            <button type="button" className="btn btn--request btn--lg" onClick={onStartRequest}>
              <RequestIcon />
              {t('Private access & requests')}
            </button>
            <button type="button" className="btn btn--lg" onClick={() => onNavigate('projects')}>
              {t('Browse projects')}
              <ArrowIcon />
            </button>
          </div>

          <div className="hero__socials">
            <span className="hero__socials-label">{t('Find me on')}</span>
            <SocialLinks />
          </div>
        </div>

        {/* What is on the bench right now — the detail the introduction used
            to carry in one long paragraph. */}
        <aside className="now" aria-labelledby="now-title">
          <p className="now__label">{t('Currently building')}</p>
          <h2 className="now__title" id="now-title">
            QLink
          </h2>
          <p className="now__text">{t('QLINK_TEXT')}</p>
          <p className="now__note">{t('Early version · test builds on request')}</p>
          <HelpWanted help={qlinkHelp} locale={locale} />
          <div className="now__also">
            <span className="now__also-label">{t('Also in progress')}</span>
            <span className="tag">ARIS</span>
            <span className="tag">FLUID</span>
            <span className="tag">DeepVision-Web</span>
          </div>
        </aside>
      </section>

      <div className="metrics metrics--hero" data-reveal>
        <Metric value={projects.length} label={t('Public projects')} />
        <Metric value={stats.stars} label={t('GitHub stars')} />
        <Metric value={stats.languages.length} label={t('Languages')} />
        <Metric value={formatRelative(stats.lastPush, locale)} label={t('Last push')} />
      </div>

      <Gallery projects={gallery} onOpen={onOpenProject} onAll={() => onNavigate('projects')} />

      {latest.length > 0 && (
        <section className="band">
          <div className="band__head" data-reveal>
            <div>
              <h2 className="band__title">{t('Latest')}</h2>
              <p className="band__hint">{t('New videos and milestones from the timeline.')}</p>
            </div>
            <div className="band__nav">
              <a
                className="btn btn--sm btn--youtube"
                href={YOUTUBE.href}
                target="_blank"
                rel="me noopener noreferrer"
              >
                <YouTubeIcon />
                {t('YouTube channel')}
              </a>
              <button type="button" className="btn btn--sm" onClick={() => onOpenTimeline()}>
                {labels.timeline}
                <ArrowIcon />
              </button>
            </div>
          </div>

          <div className="latest">
            {latest.map((entry, i) => {
              const visual = entryVisual(entry)
              const video = hasVideo(entry)
              return (
                <button
                  key={entry.id}
                  type="button"
                  className="latest__item"
                  data-reveal
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => onOpenTimeline(entry.id)}
                >
                  <span className="latest__media" data-empty={!visual}>
                    {visual && <img src={asset(visual.src)} alt="" loading="lazy" decoding="async" />}
                    <span className="latest__badge" data-video={video}>
                      {video ? <PlayIcon /> : <TimelineIcon />}
                    </span>
                  </span>
                  <span className="latest__meta">
                    <span className={`tl-dot tl-dot--${entry.status}`} aria-hidden />
                    {entry.date && formatTimelineDate(entry.date, locale)}
                    <span aria-hidden>·</span>
                    {video ? t('Video') : entry.status === 'now' ? t('In progress') : t('Milestone')}
                  </span>
                  <span className="latest__title">{pick(entry.title, locale)}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="band">
        <div className="band__head" data-reveal>
          <div>
            <h2 className="band__title">{t('Explore')}</h2>
            <p className="band__hint">{t('The rest of the site, one step away.')}</p>
          </div>
        </div>

        <div className="tiles">
          <Tile
            index={0}
            icon={<TimelineIcon />}
            title={labels.timeline}
            text={t('TILE_TIMELINE')}
            action={t('Open the timeline')}
            onAction={() => onOpenTimeline()}
          >
            {(['planned', 'now', 'done'] as const).map((status) => {
              const n = timelineEntries.filter((e) => e.status === status).length
              if (!n) return null
              const label = { planned: 'Planned', now: 'In progress', done: 'Done' }[status]
              return (
                <span key={status} className="tag">
                  {t(label)}
                  <span className="tag__n">{n}</span>
                </span>
              )
            })}
          </Tile>

          <Tile
            index={1}
            icon={<StackIcon />}
            title={t('Stack')}
            text={t('TILE_STACK')}
            action={t('Open the stack')}
            onAction={() => onNavigate('stack')}
          >
            {stats.languages.slice(0, TOP_LANGUAGES).map(([name, count]) => (
              <span key={name} className="tag tag--language">
                <LanguageIcon language={name} size={16} />
                {name}
                <span className="tag__n">{count}</span>
              </span>
            ))}
          </Tile>

          <Tile
            index={2}
            icon={<AboutIcon />}
            title={t('About')}
            text={t('TILE_ABOUT')}
            action={t('Read about me')}
            onAction={() => onNavigate('about')}
          >
            <span className="tag">embedded</span>
            <span className="tag">LLM &amp; RAG</span>
            <span className="tag">security</span>
            <span className="tag">game AI</span>
          </Tile>

          <Tile
            index={3}
            icon={<MailIcon />}
            title={t('Contact')}
            text={t('TILE_CONTACT')}
            action={t('Get in touch')}
            onAction={() => onNavigate('contact')}
          >
            <span className="tag">SimpleX</span>
            <span className="tag">email</span>
            <span className="tag">PGP</span>
          </Tile>
        </div>
      </section>
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

/** One way into another tab: what it is, a taste of what it holds, and the
 *  link. The whole tile is the button. */
function Tile({
  icon,
  title,
  text,
  action,
  onAction,
  index,
  children,
}: {
  icon: React.ReactNode
  title: string
  text: string
  action: string
  onAction: () => void
  /** Position in the row; drives the staggered reveal. */
  index: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="tile"
      data-reveal
      style={{ '--i': index } as React.CSSProperties}
      onClick={onAction}
    >
      <span className="tile__icon" aria-hidden>
        {icon}
      </span>
      <span className="tile__title">{title}</span>
      <span className="tile__text">{text}</span>
      <span className="tagrow tile__tags">{children}</span>
      <span className="tile__link">
        {action}
        <ArrowIcon />
      </span>
    </button>
  )
}

/**
 * Horizontal project gallery. Touch devices swipe it natively; on desktop the
 * arrows page it and the track can be dragged with the mouse. Snapping is
 * turned off mid-drag, otherwise the browser fights every pointer move.
 */
function Gallery({
  projects,
  onOpen,
  onAll,
}: {
  projects: Project[]
  onOpen: (name: string) => void
  onAll: () => void
}) {
  const { t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ x: 0, left: 0, moved: false })

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
  }, [])

  // Browsers may restore an overflow container's previous horizontal position
  // when this tab mounts again. Always lead with the first curated project;
  // repeat once on the next frame to win against late scroll restoration.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const reset = () => {
      el.scrollLeft = 0
      sync()
    }
    reset()
    const frame = requestAnimationFrame(reset)
    return () => cancelAnimationFrame(frame)
  }, [projects, sync])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync, projects.length])

  const page = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.firstElementChild as HTMLElement | null
    const step = slide ? slide.offsetWidth + 10 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    // Touch and pen already scroll natively; hijacking them only stutters.
    if (e.pointerType !== 'mouse' || e.button !== 0 || !trackRef.current) return
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false }
    setDragging(true)
  }

  // Deliberately no setPointerCapture: with the pointer captured, the click
  // that follows is delivered to this track instead of the card under the
  // cursor, and opening a project stops working. Window listeners keep the
  // drag alive outside the track without touching where the click lands.
  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => {
      const el = trackRef.current
      if (!el) return
      const dx = e.clientX - drag.current.x
      if (Math.abs(dx) > 5) drag.current.moved = true
      el.scrollLeft = drag.current.left - dx
    }
    const end = () => setDragging(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging])

  // A card is a button, so a drag that ends over one would otherwise open it.
  function onClickCapture(e: React.MouseEvent) {
    if (!drag.current.moved) return
    e.preventDefault()
    e.stopPropagation()
    drag.current.moved = false
  }

  if (projects.length === 0) return null

  return (
    <section className="band">
      <div className="band__head" data-reveal>
        <div>
          <h2 className="band__title">{t('Featured projects')}</h2>
          <p className="band__hint">{t('Open a project for details.')}</p>
        </div>
        {/* aria-disabled rather than disabled: the state is measured from the
            DOM after mount, and a real `disabled` attribute would both differ
            from the server HTML and drop the arrows out of the tab order.
            Scrolling past an edge is a no-op anyway. */}
        <div className="band__nav">
          <button
            type="button"
            className="iconbtn"
            onClick={() => page(-1)}
            aria-disabled={edges.start}
            aria-label={t('Previous projects')}
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => page(1)}
            aria-disabled={edges.end}
            aria-label={t('More projects')}
          >
            <ChevronIcon dir="right" />
          </button>
          <button type="button" className="btn btn--sm" onClick={onAll}>
            {t('All projects')}
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`gallery__track${dragging ? ' gallery__track--dragging' : ''}`}
        data-end={edges.end}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
      >
        {projects.map((p, i) => (
          <div className="gallery__slide" key={p.name}>
            <ProjectCard project={p} index={i} onOpen={onOpen} showFeaturedBadge />
          </div>
        ))}
      </div>
    </section>
  )
}
