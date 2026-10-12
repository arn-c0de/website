'use client'

import { useMemo } from 'react'
import { asset } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { projectHref } from '@/lib/projectPages'
import { YOUTUBE } from '@/lib/socials'
import {
  ageRestriction,
  allTimelineEntries,
  entryHasPage,
  entryPath,
  entryVisual,
  formatTimelineDate,
  hasVideo,
  latestEntries,
  pick,
} from '@/lib/timeline'
import { qlinkHelp, type TimelineEntry, type TimelineYouTube } from '@/timeline.config'
import { ArrowIcon, CheckIcon, GitHubIcon, PlayIcon, TimelineIcon, YouTubeIcon } from './Icons'
import PageChrome, { CopyPageLink } from './PageChrome'
import { HelpWanted, YouTubeFigure } from './TimelinePane'

/** The repository the QLink entries and the project page belong to. */
export const QLINK_REPO = 'QLink-preview'

/**
 * QLink in one place: what it is, the newest video, where it stands on the
 * roadmap, every video so far, and how to help. Everything comes from the
 * timeline config, so a new entry there shows up here without touching this.
 */
export default function QLinkPage() {
  return (
    <I18nProvider>
      <Content />
    </I18nProvider>
  )
}

function Content() {
  const { t, locale, labels } = useI18n()
  const projects = useMemo(() => snapshotProjects(), [])
  const project = projects.find((p) => p.name === QLINK_REPO)
  const home = asset('/')

  const entries = useMemo(
    () => allTimelineEntries(projects).filter((e) => e.project === QLINK_REPO),
    [projects],
  )
  // Newest first for what happened; soonest first for what is planned.
  const done = useMemo(() => latestEntries(entries, Infinity).filter((e) => e.status === 'done'), [entries])
  const now = entries.filter((e) => e.status === 'now')
  const planned = entries
    .filter((e) => e.status === 'planned')
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  const videos = done.filter(hasVideo)
  const newest = videos[0]
  const newestVideo = newest?.media?.find((m): m is TimelineYouTube => 'youtube' in m)

  const when = (e: TimelineEntry) => (e.when ? pick(e.when, locale) : e.date ? formatTimelineDate(e.date, locale) : '')

  return (
    <PageChrome back={{ href: home, label: labels.overview }}>
      <article className="pane qlp">
        <header className="pp-head">
          {project?.icon ? (
            <img className="pp-head__icon" src={project.icon} alt="" width={56} height={56} />
          ) : null}
          <div className="pp-head__text">
            <p className="pp-head__kicker">{t('Currently building')}</p>
            <h1 className="pp-head__title">QLink</h1>
            <p className="pp-head__lede">{t('QLINK_TEXT')}</p>
            <p className="qlp__note">{t('Early version · test builds on request')}</p>
          </div>
        </header>

        <div className="pp-actions">
          {project?.html_url && (
            <a className="btn" href={project.html_url} target="_blank" rel="noopener noreferrer">
              <GitHubIcon size={14} />
              {t('Repository')}
            </a>
          )}
          {project && (
            <a className="btn" href={projectHref(project)}>
              {t('Project page')}
            </a>
          )}
          <a className="btn btn--youtube" href={YOUTUBE.href} target="_blank" rel="me noopener noreferrer">
            <YouTubeIcon />
            {t('YouTube channel')}
          </a>
          <CopyPageLink />
        </div>

        {newest && newestVideo && (
          <section className="qlp__section">
            <h2 className="pp-label">{t('Latest video')}</h2>
            <div className="qlp__feature">
              <YouTubeFigure video={newestVideo} locale={locale} slot="a" />
              <div className="qlp__feature-text">
                <p className="post__meta">
                  <span className="tl-dot tl-dot--done" aria-hidden />
                  {when(newest)}
                </p>
                <h3 className="qlp__feature-title">{pick(newest.title, locale)}</h3>
                <p className="qlp__feature-lede">{pick(newest.text, locale)}</p>
                <a className="tl-link" href={asset(entryPath(newest.id))}>
                  {t('Read post')}
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="qlp__section">
          <h2 className="pp-label">{t('Roadmap')}</h2>
          <div className="qlp__road">
            <RoadColumn title={t('In progress')} status="now" entries={now} when={when} />
            <RoadColumn title={t('Planned')} status="planned" entries={planned} when={when} />
            <RoadColumn title={t('Done')} status="done" entries={done.slice(0, 6)} when={when} />
          </div>
          <a className="tl-link qlp__more" href={`${home}?tab=timeline`}>
            {t('The whole timeline')}
            <ArrowIcon />
          </a>
        </section>

        {videos.length > 1 && (
          <section className="qlp__section">
            <h2 className="pp-label">{t('All videos')}</h2>
            <div className="latest">
              {videos.map((entry) => {
                const visual = entryVisual(entry)
                const adult = entry.media?.some((m) => 'youtube' in m && ageRestriction(m))
                return (
                  <a key={entry.id} className="latest__item" href={asset(entryPath(entry.id))}>
                    <span className="latest__media" data-empty={!visual}>
                      {adult && <span className="tl-video__age">18+</span>}
                      {visual && (
                        <img
                          src={asset(visual.src)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          data-sensitive={visual.sensitive || undefined}
                        />
                      )}
                      <span className="latest__badge" data-video>
                        <PlayIcon />
                      </span>
                    </span>
                    <span className="latest__meta">
                      <span className="tl-dot tl-dot--done" aria-hidden />
                      {when(entry)}
                    </span>
                    <span className="latest__title">{pick(entry.title, locale)}</span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        <section className="qlp__section">
          <h2 className="pp-label">{t('Help wanted')}</h2>
          <p className="qlp__help-text">{t('QLINK_HELP_TEXT')}</p>
          <HelpWanted help={qlinkHelp} locale={locale} />
        </section>
      </article>
    </PageChrome>
  )
}

function RoadColumn({
  title,
  status,
  entries,
  when,
}: {
  title: string
  status: TimelineEntry['status']
  entries: TimelineEntry[]
  when: (e: TimelineEntry) => string
}) {
  const { locale } = useI18n()
  if (entries.length === 0) return null
  return (
    <div className="qlp__col">
      <h3 className="qlp__col-title">
        <span className={`tl-dot tl-dot--${status}`} aria-hidden />
        {title}
      </h3>
      <ol className="qlp__list">
        {entries.map((e) => {
          const body = (
            <>
              <span className="qlp__when">{when(e)}</span>
              <span className="qlp__name">{pick(e.title, locale).replace(/^QLink:\s*/, '')}</span>
            </>
          )
          return (
            <li key={e.id}>
              {entryHasPage(e) ? (
                <a className="qlp__row" href={asset(entryPath(e.id))}>
                  {body}
                  {status === 'done' ? <CheckIcon /> : <TimelineIcon />}
                </a>
              ) : (
                <span className="qlp__row">{body}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
