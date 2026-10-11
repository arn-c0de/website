'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { asset } from '@/lib/basePath'
import { loadProjects, snapshotProjects } from '@/lib/github'
import type { DataSource, Project } from '@/lib/types'
import { usePrefersReducedMotion, useRevealRoot } from '@/lib/useMotion'
import { TABS, useAppState, type Tab } from '@/lib/useAppState'
import AboutPane from './AboutPane'
import ContactPane from './ContactPane'
import OverviewPane from './OverviewPane'
import ProjectPanel from './ProjectPanel'
import ProjectsPane from './ProjectsPane'
import RequestModal from './RequestModal'
import StackPane from './StackPane'
import TimelinePane from './TimelinePane'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import { I18nProvider, useI18n } from '@/lib/i18n'
import TopSearch from './TopSearch'
import SocialLinks from './SocialLinks'
import {
  AboutIcon,
  GitHubIcon,
  MailIcon,
  OverviewIcon,
  ProjectsIcon,
  RequestIcon,
  StackIcon,
  TimelineIcon,
} from './Icons'

/** Each tab carries its mark, so a narrow screen can drop the words. */
const TAB_ICONS: Record<Tab, () => React.ReactNode> = {
  overview: OverviewIcon,
  projects: ProjectsIcon,
  timeline: TimelineIcon,
  stack: StackIcon,
  about: AboutIcon,
  contact: MailIcon,
}

/** A tap on a touch device gets the shortest tick the API will honour. */
function tick() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  if (!matchMedia('(pointer: coarse)').matches) return
  try {
    navigator.vibrate(7)
  } catch {
    /* Some browsers expose vibrate() and then refuse it; nothing to do. */
  }
}

export default function AppShell() {
  return <I18nProvider><AppShellContent /></I18nProvider>
}

function AppShellContent() {
  const { labels, t } = useI18n()
  const [{ tab, project: openProject, request, requestFor }, navigate] = useAppState()
  // Start from the committed snapshot so the first paint already has content,
  // then swap in live data when the API answers.
  const [projects, setProjects] = useState<Project[]>(snapshotProjects)
  const [source, setSource] = useState<DataSource>('snapshot')
  // Search text and the language filter live here rather than in the projects
  // tab: the stack tab hands both of them over when you pick a topic or a
  // language there, and the tab is unmounted while you do it.
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')
  const tabsRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  const shellRef = useRevealRoot<HTMLDivElement>()
  const [scrolled, setScrolled] = useState(false)
  const reduced = usePrefersReducedMotion()

  // Which way the new pane comes in from: tab order decides, so moving right
  // through the tabs always feels like moving right.
  const previousTab = useRef<Tab>(tab)
  const direction = useRef(1)
  if (previousTab.current !== tab) {
    direction.current = TABS.indexOf(tab) > TABS.indexOf(previousTab.current) ? 1 : -1
    previousTab.current = tab
  }

  // Reading progress fills the hairline under the topbar, and the bar itself
  // tightens up once the page has moved. Both are written straight to CSS
  // custom properties on a frame, so scrolling never re-renders the tree.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      document.documentElement.style.setProperty('--scroll-progress', String(progress))
      setScrolled(window.scrollY > 8)
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // The active tab sits on one shared pill that slides between them, so its
  // position has to be measured from the DOM.
  useLayoutEffect(() => {
    const nav = tabsRef.current
    if (!nav) return
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!active) return
      const { offsetLeft: left, offsetWidth: width } = active
      // Only when it actually moved: this runs on every resize, and a phone
      // fires one of those each time the on-screen keyboard opens or closes.
      setIndicator((current) =>
        current && current.left === left && current.width === width ? current : { left, width },
      )
    }
    measure()
    // Font loading and viewport changes both shift tab widths — and on a
    // narrow screen the labels themselves expand, which the pill has to
    // follow once that transition has finished.
    document.fonts?.ready.then(measure)
    const settle = setTimeout(measure, 420)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(settle)
      window.removeEventListener('resize', measure)
    }
  }, [tab, projects.length])

  useEffect(() => {
    const controller = new AbortController()
    loadProjects(controller.signal).then((result) => {
      if (controller.signal.aborted || result.source !== 'live') return
      setProjects(result.projects)
      setSource('live')
    })
    return () => controller.abort()
  }, [])

  const selected = useMemo(
    () => projects.find((p) => p.name === openProject) ?? null,
    [projects, openProject],
  )

  // The panel is an overlay, so opening one keeps you where you were — the
  // overview gallery and the topbar search both slide it out in place.
  const openDetail = useCallback((name: string) => navigate({ project: name }), [navigate])
  const closeDetail = useCallback(() => navigate({ project: null }), [navigate])
  const closeRequest = useCallback(() => navigate({ request: false }), [navigate])
  const setRequestFor = useCallback(
    (names: string[]) => navigate({ requestFor: names }),
    [navigate],
  )

  // From the detail panel: close it, open the request modal over the page and
  // keep the project attached (without adding it twice).
  const startRequest = useCallback(
    (repo?: string) =>
      navigate({
        project: null,
        request: true,
        requestFor: !repo || requestFor.includes(repo) ? requestFor : [...requestFor, repo],
      }),
    [navigate, requestFor],
  )

  /**
   * Changing tab replaces the whole page body, so it gets a real transition
   * rather than an entrance: the outgoing pane falls back and blurs out while
   * the next one comes forward, and the pill glides under the tab you pressed.
   *
   * That is what a view transition is for — the browser snapshots the page as
   * it is painted, so the old pane needs no second render and none of its
   * scroll-revealed pieces have to be re-shown. Without the API (or with
   * reduced motion asked for) the state just changes and the CSS entrance in
   * globals.css carries it.
   */
  const selectTab = useCallback(
    (next: Tab) => {
      tick()
      if (next === tab) {
        // Same tab pressed again: treat it as "take me back to the top".
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
        navigate({ project: null })
        return
      }

      const forward = TABS.indexOf(next) > TABS.indexOf(tab)
      // flushSync so React has committed the new pane before the browser
      // captures the after state.
      const apply = () => {
        flushSync(() => navigate({ tab: next, project: null }))
        // The pane and its heading carry their own entrance for browsers
        // without this API. Here the transition *is* the entrance, so they are
        // sent to their finished state before the snapshot is taken —
        // otherwise the snapshot catches them at frame zero, invisible.
        document
          .querySelector('.pane')
          ?.getAnimations({ subtree: true })
          .forEach((animation) => {
            if (animation.effect?.getTiming().iterations !== Infinity) animation.finish()
          })
      }

      if (reduced || !document.startViewTransition) {
        apply()
        return
      }

      const root = document.documentElement
      root.dataset.vt = 'tab'
      root.dataset.vtDir = forward ? 'forward' : 'back'
      const transition = document.startViewTransition(apply)
      const clear = () => {
        delete root.dataset.vt
        delete root.dataset.vtDir
      }
      // Both branches clear: an interrupted transition still applied the
      // state, and leaving the attributes on would name the next snapshot.
      transition.finished.then(clear, clear)
    },
    [navigate, reduced, tab],
  )

  /**
   * Arrow keys walk the tab row and Home/End jump to its ends — what a
   * `role="tablist"` promises a screen-reader user it will do. Selection
   * follows focus, which is the right call here: every pane is already
   * rendered from data in memory, so stepping through them costs nothing.
   */
  const onTabKeys = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const current = TABS.indexOf(tab)
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      let next = -1
      if (step !== 0) next = (current + step + TABS.length) % TABS.length
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = TABS.length - 1
      else return

      e.preventDefault()
      selectTab(TABS[next])
      // The tab that lost the focusable index would otherwise drop focus to
      // the body; move it along with the selection.
      tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
    },
    [selectTab, tab],
  )

  // Into the timeline, optionally straight to one entry once it has rendered.
  const openTimeline = useCallback(
    (id?: string) => {
      selectTab('timeline')
      if (!id) return
      let tries = 0
      const seek = () => {
        const el = document.getElementById(`tl-${id}`)
        if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
        else if (++tries < 20) requestAnimationFrame(seek)
      }
      requestAnimationFrame(seek)
    },
    [selectTab, reduced],
  )

  // Project pages link to an entry as ?tab=timeline#tl-<id>.
  useEffect(() => {
    const match = location.hash.match(/^#tl-(.+)$/)
    if (match) openTimeline(decodeURIComponent(match[1]))
    // Only the address the visitor arrived on.
  }, [])

  const showTopic = useCallback(
    (topic: string) => {
      setQuery(topic)
      setLanguage('all')
      selectTab('projects')
    },
    [selectTab],
  )

  // A language is a filter rather than a search term: "C" as free text matches
  // every description with a c in it.
  const showLanguage = useCallback(
    (name: string) => {
      setQuery('')
      setLanguage(name)
      selectTab('projects')
    },
    [selectTab],
  )

  return (
    <div className="shell" ref={shellRef}>
      <header className="topbar" data-scrolled={scrolled}>
        <div className="topbar__row">
          <button type="button" className="brand" onClick={() => selectTab('overview')}>
            {/* Served from this domain, not from GitHub's avatar CDN. */}
            <img className="brand__mark" src={asset('/avatar.jpg')} alt="" width={28} height={28} />
            <span className="brand__name">arn-c0de</span>
          </button>

          <nav
            className="tabs"
            role="tablist"
            aria-label={t('Sections')}
            ref={tabsRef}
            onKeyDown={onTabKeys}
          >
            {/* The pill is a sibling of the tabs rather than a border on the
                active one: one element that travels, instead of five that
                light up. Position comes from the layout effect above. */}
            {indicator && (
              <span
                className="tabs__pill"
                aria-hidden
                style={{ left: indicator.left, width: indicator.width }}
              />
            )}
            {TABS.map((t) => {
              const Icon = TAB_ICONS[t]
              return (
                <button
                  key={t}
                  type="button"
                  className="tab"
                  role="tab"
                  id={`tab-${t}`}
                  aria-selected={tab === t}
                  aria-controls="pane"
                  // A tablist is one stop in the tab order; the arrow keys move
                  // inside it. Tab therefore steps from the row to the pane
                  // rather than through five buttons.
                  tabIndex={tab === t ? 0 : -1}
                  onClick={() => selectTab(t)}
                >
                  <span className="tab__icon">
                    <Icon />
                  </span>
                  <span className="tab__label">{labels[t]}</span>
                  {/* Keyed on the number so the badge remounts — and replays its
                      pop — when the live list lands on a different count. */}
                  {t === 'projects' && (
                    <span className="tab__count" key={projects.length}>
                      {projects.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <span className="topbar__spacer" />

          <TopSearch
            projects={projects}
            onNavigate={selectTab}
            onOpenProject={openDetail}
            onStartRequest={() => startRequest()}
          />

          <button
            type="button"
            className="btn btn--request btn--sm"
            onClick={() => startRequest()}
            aria-label={t('Start a request')}
          >
            <RequestIcon />
            <span className="btn__label">{labels.request}</span>
          </button>

          <a
            className="iconbtn"
            href="https://github.com/arn-c0de"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('GitHub profile')}
          >
            <GitHubIcon size={15} />
          </a>

          <LanguageToggle />
          <ThemeToggle />
        </div>

        {/* Reading progress; width comes from --scroll-progress. */}
        <span className="topbar__progress" aria-hidden />
      </header>

      {/* One panel whose contents swap, so it is labelled by whichever tab is
          selected rather than by five panels' worth of markup. */}
      <main
        className="main"
        id="pane"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        data-dir={direction.current > 0 ? 'forward' : 'back'}
      >
        {tab === 'overview' && (
          <OverviewPane
            projects={projects}
            onNavigate={selectTab}
            onOpenProject={openDetail}
            onStartRequest={() => startRequest()}
            onOpenTimeline={openTimeline}
          />
        )}
        {tab === 'projects' && (
          <ProjectsPane
            projects={projects}
            query={query}
            onQueryChange={setQuery}
            language={language}
            onLanguageChange={setLanguage}
            onOpen={openDetail}
          />
        )}
        {tab === 'timeline' && <TimelinePane projects={projects} onOpenProject={openDetail} />}
        {tab === 'stack' && (
          <StackPane
            projects={projects}
            onTopicSelect={showTopic}
            onLanguageSelect={showLanguage}
            onOpenProject={openDetail}
          />
        )}
        {tab === 'about' && (
          <AboutPane projects={projects} onStartRequest={() => startRequest()} />
        )}
        {tab === 'contact' && <ContactPane onStartRequest={() => startRequest()} />}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <img src={asset('/avatar.jpg')} alt="" width={22} height={22} />
            <span>arn-c0de</span>
            <span className="footer__sep" aria-hidden>·</span>
            <span className="footer__muted">{t('Embedded systems, security tooling and local AI')}</span>
          </div>

          <div className="footer__row">
            <span className="footer__status">
              <span className={`dot dot--${source}`} />
              {source === 'live' ? t('Live from the GitHub API') : t('Showing committed snapshot')}
            </span>
            <span>{t('No tracking, no cookies, no analytics.')}</span>
            <span className="footer__link">
              <SocialLinks variant="icons" />
            </span>
          </div>

          <details className="privacy">
            <summary>{t('Privacy')}</summary>
            <div className="privacy__body">
              <p>{t('PRIVACY_1')}</p>
              <p>
                {t('PRIVACY_2_PRE')} <span className="mono">api.github.com</span>{' '}
                {t('PRIVACY_2_POST')}
              </p>
              <p>{t('PRIVACY_VIDEO')}</p>
              <p>{t('PRIVACY_3')}</p>
            </div>
          </details>
        </div>
      </footer>

      {selected && (
        <ProjectPanel
          project={selected}
          projects={projects}
          onClose={closeDetail}
          onOpen={openDetail}
          onRequest={startRequest}
        />
      )}

      {request && (
        <RequestModal
          projects={projects}
          selected={requestFor}
          onSelectedChange={setRequestFor}
          onClose={closeRequest}
        />
      )}
    </div>
  )
}
