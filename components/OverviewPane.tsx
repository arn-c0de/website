'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { asset } from '@/lib/basePath'
import { formatRelative } from '@/lib/format'
import type { Project } from '@/lib/types'
import type { Tab } from '@/lib/useAppState'
import Metric from './Metric'
import ProjectCard from './ProjectCard'
import { ArrowIcon, ChevronIcon, GitHubIcon, LanguageIcon, RequestIcon } from './Icons'

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
}: {
  projects: Project[]
  onNavigate: (tab: Tab) => void
  onOpenProject: (name: string) => void
  onStartRequest: () => void
}) {
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
        <img className="hero__avatar" src={asset('/avatar.jpg')} alt="" width={60} height={60} />

        <div className="hero__text">
          <h1 className="hero__name">arn-c0de</h1>
          <p className="hero__role">
            Industrial traceability · embedded systems · backends &amp; databases · web apps · local
            AI · security
          </p>
          <p className="hero__lede">
            I am currently building a web application for end-to-end traceability in industrial
            environments, connecting products, processes, quality data and events in one auditable
            history. I also build things close to the hardware and tools that make complicated
            systems easier to understand.
          </p>

          <div className="hero__actions">
            <button type="button" className="btn btn--request" onClick={onStartRequest}>
              <RequestIcon />
              Start a request
            </button>
            <button type="button" className="btn" onClick={() => onNavigate('projects')}>
              Browse projects
              <ArrowIcon />
            </button>
            <a
              className="btn"
              href="https://github.com/arn-c0de"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={14} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="metrics" data-reveal>
        <Metric value={projects.length} label="Projects" />
        <Metric value={stats.stars} label="Stars" />
        <Metric value={stats.languages.length} label="Languages" />
        <Metric value={formatRelative(stats.lastPush)} label="Last push" />
      </div>

      <Gallery projects={gallery} onOpen={onOpenProject} onAll={() => onNavigate('projects')} />

      <section className="band">
        <div className="band__head" data-reveal>
          <div>
            <h2 className="band__title">Everything else</h2>
            <p className="band__hint">Three sections, one line each.</p>
          </div>
        </div>

        <div className="slabs">
          <Slab
            index={0}
            title="Stack"
            text="Languages, domains and shared topics — counted from the repositories themselves, so it can never drift out of date."
            action="Open the stack"
            onAction={() => onNavigate('stack')}
          >
            {stats.languages.slice(0, TOP_LANGUAGES).map(([name, count]) => (
              <span key={name} className="tag tag--language">
                <LanguageIcon language={name} size={16} />
                {name}
                <span className="tag__n">{count}</span>
              </span>
            ))}
          </Slab>

          <Slab
            index={1}
            title="About"
            text="What I focus on, and the handful of principles the projects are built on: local by default, security that stays honest, readable over clever."
            action="Read about me"
            onAction={() => onNavigate('about')}
          >
            <span className="tag">traceability</span>
            <span className="tag">industrial web apps</span>
            <span className="tag">embedded</span>
            <span className="tag">LLM &amp; RAG</span>
            <span className="tag">game AI</span>
            <span className="tag">databases</span>
            <span className="tag">security</span>
            <span className="tag">android</span>
          </Slab>

          <Slab
            index={2}
            title="Contact"
            text="Questions about a project, help getting something running, a bug or security finding, or an idea you would like built."
            action="Get in touch"
            onAction={() => onNavigate('contact')}
          >
            <span className="tag">SimpleX</span>
            <span className="tag">email</span>
            <span className="tag">PGP</span>
          </Slab>
        </div>
      </section>
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

/** A section in one row: what it is on the left, what it holds and the way in
 *  on the right third. */
function Slab({
  title,
  text,
  action,
  onAction,
  index,
  children,
}: {
  title: string
  text: string
  action: string
  onAction: () => void
  /** Position in the column; drives the staggered reveal. */
  index: number
  children: React.ReactNode
}) {
  return (
    <div className="slab" data-reveal style={{ '--i': index } as React.CSSProperties}>
      <div>
        <h3 className="slab__title">{title}</h3>
        <p className="slab__text">{text}</p>
      </div>
      <div className="slab__side">
        <div className="tagrow">{children}</div>
        <button type="button" className="slab__link" onClick={onAction}>
          {action}
          <ArrowIcon />
        </button>
      </div>
    </div>
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
          <h2 className="band__title">Featured projects</h2>
          <p className="band__hint">Swipe or use the arrows — pick one for readme and links.</p>
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
            aria-label="Previous projects"
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => page(1)}
            aria-disabled={edges.end}
            aria-label="More projects"
          >
            <ChevronIcon dir="right" />
          </button>
          <button type="button" className="btn btn--sm" onClick={onAll}>
            All projects
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
