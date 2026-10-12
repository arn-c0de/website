'use client'

import { useEffect, useMemo, useState } from 'react'
import { asset } from '@/lib/basePath'
import { formatMonth, formatRelative, languageHue } from '@/lib/format'
import { loadProjects, snapshotProjects } from '@/lib/github'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { projectHref, relatedProjects } from '@/lib/projectPages'
import type { PreparedReadme } from '@/lib/readmeHtml'
import { allTimelineEntries, entryVisual, formatTimelineDate, hasVideo, pick, sortTimeline } from '@/lib/timeline'
import type { Project } from '@/lib/types'
import {
  ArrowIcon,
  GitHubIcon,
  LinkIcon,
  PlayIcon,
  RequestIcon,
  TimelineIcon,
} from './Icons'
import PageChrome, { CopyPageLink } from './PageChrome'
import Readme from './Readme'

/**
 * A project's own page: what the detail panel shows, at an address of its
 * own that search engines index and chat apps unfurl. Prerendered from the
 * committed snapshot; the live numbers replace it once the API answers.
 */
export default function ProjectPage({ name, readme }: { name: string; readme: PreparedReadme | null }) {
  return (
    <I18nProvider>
      <Content name={name} readme={readme} />
    </I18nProvider>
  )
}

function Content({ name, readme }: { name: string; readme: PreparedReadme | null }) {
  const { t, locale } = useI18n()
  const [projects, setProjects] = useState<Project[]>(() => snapshotProjects())

  useEffect(() => {
    const controller = new AbortController()
    loadProjects(controller.signal).then((result) => {
      if (!controller.signal.aborted && result.source === 'live') setProjects(result.projects)
    })
    return () => controller.abort()
  }, [])

  // The prerendered page always has its project; a live list that has since
  // lost it (renamed, hidden) keeps showing the snapshot rather than nothing.
  const project =
    projects.find((p) => p.name === name) ?? snapshotProjects().find((p) => p.name === name)!

  const entries = useMemo(
    () => sortTimeline(allTimelineEntries(projects)).filter((e) => e.project === name),
    [projects, name],
  )
  const related = useMemo(() => relatedProjects(project, projects), [project, projects])
  const home = asset('/')

  const links = [
    ...(project.html_url ? [{ label: t('Repository'), href: project.html_url, icon: <GitHubIcon size={14} /> }] : []),
    ...(project.homepage ? [{ label: t('Homepage'), href: project.homepage, icon: <LinkIcon /> }] : []),
    ...project.links.map((l) => ({ ...l, icon: <LinkIcon /> })),
  ]

  return (
    <PageChrome
      back={{ href: `${home}?tab=projects`, label: t('All projects') }}
      action={
        <a
          className="btn btn--request btn--sm"
          href={`${home}?request=1&for=${encodeURIComponent(project.name)}`}
          aria-label={t('Ask about this')}
        >
          <RequestIcon />
          <span className="btn__label">{t('Ask about this')}</span>
        </a>
      }
    >
      <article className="pane pp">
        <header className="pp-head">
          {project.icon ? (
            <img className="pp-head__icon" src={project.icon} alt="" width={56} height={56} />
          ) : (
            <span className="pp-head__icon pp-head__icon--mono" aria-hidden>
              {project.title.charAt(0)}
            </span>
          )}
          <div className="pp-head__text">
            <p className="pp-head__kicker">
              <a href={`${home}?tab=projects`}>{t('Projects')}</a>
              <span aria-hidden>/</span>
              {t(project.category)}
              {project.status !== 'active' && (
                <span className={`card__flag card__flag--${project.status}`}>{t(project.status)}</span>
              )}
            </p>
            <h1 className="pp-head__title">{project.title}</h1>
            {project.description && <p className="pp-head__lede">{project.description}</p>}
          </div>
        </header>

        <div className="pp-actions">
          {links.map((link) => (
            <a key={link.href} className="btn" href={link.href} target="_blank" rel="noopener noreferrer">
              {link.icon}
              {link.label}
            </a>
          ))}
          <CopyPageLink />
        </div>

        <div className="metrics pp-metrics">
          <div className="metric">
            <div className="metric__v">{project.stargazers_count}</div>
            <div className="metric__k">{t('Stars')}</div>
          </div>
          <div className="metric">
            <div className="metric__v">{project.forks_count}</div>
            <div className="metric__k">{t('Forks')}</div>
          </div>
          <div className="metric">
            <div className="metric__v metric__v--text">{formatMonth(project.created_at, locale)}</div>
            <div className="metric__k">{t('Created')}</div>
          </div>
          <div className="metric">
            <div className="metric__v metric__v--text">{formatRelative(project.pushed_at, locale)}</div>
            <div className="metric__k">{t('Last push')}</div>
          </div>
        </div>

        <div className="pp-body">
          <section className="pp-readme">
            <h2 className="pp-label">{t('Readme')}</h2>
            <Readme project={project} prerendered={readme} />
          </section>

          <div className="pp-side">
            <section>
              <h2 className="pp-label">{t('Details')}</h2>
              <dl className="deflist">
                {project.language && (
                  <>
                    <dt>{t('Language')}</dt>
                    <dd>
                      <span className="lang" style={{ '--hue': languageHue(project.language) } as React.CSSProperties}>
                        <span className="lang__dot" />
                        {project.language}
                      </span>
                    </dd>
                  </>
                )}
                <dt>{t('License')}</dt>
                <dd>
                  {!project.license || project.license === 'NOASSERTION' ? t('see repository') : project.license}
                </dd>
                {project.topics.length > 0 && (
                  <>
                    <dt>{t('Topics')}</dt>
                    <dd>
                      <span className="tagrow">
                        {project.topics.map((topic) => (
                          <span key={topic} className="tag">
                            {topic}
                          </span>
                        ))}
                      </span>
                    </dd>
                  </>
                )}
              </dl>
            </section>

            {entries.length > 0 && (
              <section>
                <h2 className="pp-label">{t('In the timeline')}</h2>
                <ul className="pp-list">
                  {entries.map((entry) => {
                    const visual = entryVisual(entry)
                    const video = hasVideo(entry)
                    return (
                      <li key={entry.id}>
                        <a className="pp-entry" href={`${home}?tab=timeline#tl-${entry.id}`}>
                          <span className="pp-entry__media" data-empty={!visual}>
                            {visual ? (
                              <img src={asset(visual.src)} alt="" loading="lazy" decoding="async" data-sensitive={visual.sensitive || undefined} />
                            ) : video ? (
                              <PlayIcon />
                            ) : (
                              <TimelineIcon />
                            )}
                          </span>
                          <span className="pp-entry__text">
                            <span className="pp-entry__meta">
                              <span className={`tl-dot tl-dot--${entry.status}`} aria-hidden />
                              {entry.date
                                ? formatTimelineDate(entry.date, locale)
                                : entry.status === 'planned'
                                  ? t('Planned')
                                  : t('In progress')}
                              {video && (
                                <>
                                  <span aria-hidden>·</span>
                                  {t('Video')}
                                </>
                              )}
                            </span>
                            <span className="pp-entry__title">{pick(entry.title, locale)}</span>
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {related.length > 0 && (
              <section>
                <h2 className="pp-label">{t('Related projects')}</h2>
                <ul className="pp-list">
                  {related.map((p) => (
                    <li key={p.name}>
                      <a className="pp-related" href={projectHref(p)}>
                        <span className="pp-related__title">{p.title}</span>
                        {p.description && <span className="pp-related__desc">{p.description}</span>}
                        <ArrowIcon />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>
    </PageChrome>
  )
}
