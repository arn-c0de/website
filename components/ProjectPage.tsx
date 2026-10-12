'use client'

import { useEffect, useMemo, useState } from 'react'
import { asset } from '@/lib/basePath'
import { formatMonth, formatRelative, languageHue } from '@/lib/format'
import { loadProjects, snapshotProjects } from '@/lib/github'
import { I18nProvider, useI18n, type Locale } from '@/lib/i18n'
import { projectHref, relatedProjects } from '@/lib/projectPages'
import { unparkImages, type PreparedReadme } from '@/lib/readmeHtml'
import type { DocKind, RepoDoc } from '@/lib/repoDocs'
import { formatBytes, latestRelease } from '@/lib/releases'
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
import ProjectIcon from './ProjectIcon'

/**
 * A project's own page: what the detail panel shows, at an address of its
 * own that search engines index and chat apps unfurl. Prerendered from the
 * committed snapshot; the live numbers replace it once the API answers.
 */
export default function ProjectPage({
  name,
  readme,
  docs = [],
  locale,
}: {
  name: string
  readme: PreparedReadme | null
  docs?: RepoDoc[]
  locale: Locale
}) {
  return (
    <I18nProvider locale={locale}>
      <Content name={name} readme={readme} docs={docs} />
    </I18nProvider>
  )
}

function Content({ name, readme, docs }: { name: string; readme: PreparedReadme | null; docs: RepoDoc[] }) {
  const { t, locale, href } = useI18n()
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
  const release = latestRelease(project.name)
  const home = href('/')

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
            <ProjectIcon src={project.icon} dark={project.iconDark} className="pp-head__icon" size={56} />
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
          {project.name === 'QLink-preview' && (
            <a className="btn" href={href('/qlink/')}>
              {t('Videos, roadmap and more')}
            </a>
          )}
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

        {release && (
          <section className="pp-release">
            <h2 className="pp-label">{t('Latest release')}</h2>
            <p className="pp-release__head">
              <a href={release.url} target="_blank" rel="noopener noreferrer">
                {release.name}
              </a>
              {release.name !== release.tag && <span className="mono">{release.tag}</span>}
              {release.date && <span>{formatTimelineDate(release.date, locale)}</span>}
              {release.prerelease && <span className="card__flag card__flag--preview">{t('Pre-release')}</span>}
            </p>
            {release.assets.length > 0 ? (
              <ul className="pp-release__files">
                {release.assets.map((a) => (
                  <li key={a.url}>
                    <a href={a.url} rel="noopener noreferrer">
                      <span className="pp-release__file">{a.name}</span>
                      <span className="pp-release__size">{formatBytes(a.size)}</span>
                      <span className="pp-release__get">{t('Download')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pp-release__none">{t('Source code only — download it from the release page.')}</p>
            )}
            {release.notes && (
              <details className="pp-release__notes">
                <summary>{t('Release notes')}</summary>
                <div className="readme" dangerouslySetInnerHTML={{ __html: release.notes }} />
              </details>
            )}
          </section>
        )}

        <div className="pp-body">
          <section className="pp-readme">
            <h2 className="pp-label">{t('Readme')}</h2>
            <Readme project={project} prerendered={readme} />
            {docs.map((doc) => (
              <RepoDocSection key={doc.path} doc={doc} repoUrl={project.html_url} />
            ))}
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
                      <a className="pp-related" href={projectHref(p, locale)}>
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

const DOC_LABEL: Record<DocKind, string> = {
  roadmap: 'Roadmap',
  milestones: 'Milestones',
  features: 'Features',
  changelog: 'Changelog',
  doc: 'Documentation',
}

/**
 * A markdown file from the repo under the readme. Roadmap and milestones
 * open, the rest folded; images stay parked until the visitor asks.
 */
function RepoDocSection({ doc, repoUrl }: { doc: RepoDoc; repoUrl: string }) {
  const { t } = useI18n()
  const [imagesShown, setImagesShown] = useState(false)
  const url = `${repoUrl}/blob/HEAD/${doc.path}`
  return (
    <section className="pp-doc">
      <details open={doc.kind === 'roadmap' || doc.kind === 'milestones'}>
        <summary className="pp-doc__summary">
          <h2 className="pp-label">{t(DOC_LABEL[doc.kind])}</h2>
          <span className="pp-doc__path">{doc.path}</span>
        </summary>
        {doc.images > 0 && !imagesShown && (
          <button type="button" className="btn btn--sm pp-doc__images" onClick={() => setImagesShown(true)}>
            {t('Load images')} ({doc.images})
          </button>
        )}
        <div
          className={`readme${imagesShown ? '' : ' readme--noimg'}`}
          dangerouslySetInnerHTML={{ __html: imagesShown ? unparkImages(doc.html) : doc.html }}
        />
        <p className="pp-doc__more">
          {doc.truncated && <>{t('Shortened here.')} </>}
          <a href={url} target="_blank" rel="noopener noreferrer">
            {t('Full file on GitHub')}
          </a>
        </p>
      </details>
    </section>
  )
}
