'use client'

import { useMemo, useState } from 'react'
import { asset } from '@/lib/basePath'
import { snapshotProjects } from '@/lib/github'
import { I18nProvider, useI18n, type Locale } from '@/lib/i18n'
import { hasLinkablePage, projectHref } from '@/lib/projectPages'
import {
  allTimelineEntries,
  entryHasPage,
  entryPath,
  formatTimelineDate,
  hasVideo,
  latestEntries,
  paragraphs,
  pick,
} from '@/lib/timeline'
import type { TimelineImage, TimelineMedia } from '@/timeline.config'
import { LinkIcon } from './Icons'
import PageChrome, { CopyPageLink } from './PageChrome'
import { Figure, HelpWanted, Lightbox, VideoFigure, YouTubeFigure } from './TimelinePane'
import ProjectIcon from './ProjectIcon'

/**
 * A timeline entry as a post of its own: the short text, every picture and
 * video at full width, the longer write-up from `body`, and the way to the
 * older and newer posts.
 */
export default function TimelinePost({ id, locale }: { id: string; locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Content id={id} />
    </I18nProvider>
  )
}

function Content({ id }: { id: string }) {
  const { t, locale, labels, href } = useI18n()
  const [zoomed, setZoomed] = useState<TimelineImage | null>(null)
  const projects = useMemo(() => snapshotProjects(), [])
  // Newest first, as the feed and the overview order them.
  const posts = useMemo(
    () => latestEntries(allTimelineEntries(projects), Infinity).filter(entryHasPage),
    [projects],
  )
  const index = posts.findIndex((e) => e.id === id)
  const entry = posts[index]
  const newer = index > 0 ? posts[index - 1] : null
  const older = index < posts.length - 1 ? posts[index + 1] : null
  const project = entry.project ? projects.find((p) => p.name === entry.project) : undefined
  const media: TimelineMedia[] = entry.media ?? entry.images ?? []
  const home = href('/')

  const figure = (item: TimelineMedia, slot: string) => {
    if ('youtube' in item) return <YouTubeFigure key={slot} video={item} locale={locale} slot={slot} />
    if ('video' in item) return <VideoFigure key={slot} video={item} locale={locale} slot={slot} />
    return <Figure key={slot} image={item} locale={locale} slot={slot} onZoom={setZoomed} />
  }

  return (
    <PageChrome back={{ href: `${home}?tab=timeline`, label: labels.timeline }}>
      <article className="pane post">
        <p className="post__meta">
          <span className={`tl-dot tl-dot--${entry.status}`} aria-hidden />
          <time dateTime={entry.date}>{formatTimelineDate(entry.date!, locale)}</time>
          <span aria-hidden>·</span>
          {entry.status === 'now' ? t('In progress') : t('Done')}
          {hasVideo(entry) && (
            <>
              <span aria-hidden>·</span>
              {t('Video')}
            </>
          )}
        </p>
        <h1 className="post__title">
          {project?.icon && <ProjectIcon src={project.icon} dark={project.iconDark} className="post__icon" size={36} />}
          {pick(entry.title, locale)}
        </h1>
        {pick(entry.text, locale) && <p className="post__lede">{pick(entry.text, locale)}</p>}

        {media.length > 0 && (
          <div className="post__media">{media.map((item, i) => figure(item, `m${i}`))}</div>
        )}

        {[...paragraphs(entry.aside, locale), ...paragraphs(entry.body, locale)].map((p, i) => (
          <p key={i} className="post__p">
            {p}
          </p>
        ))}

        {entry.help && <HelpWanted help={entry.help} locale={locale} />}

        <div className="post__foot">
          {entry.tags?.length ? (
            <span className="tagrow">
              {entry.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
          <div className="post__actions">
            {project && hasLinkablePage(project) && (
              <a className="btn" href={projectHref(project, locale)}>
                {t('Project page')}: {project.title}
              </a>
            )}
            {entry.links?.map((link) => (
              <a key={link.href} className="btn" href={link.href} target="_blank" rel="noopener noreferrer">
                <LinkIcon />
                {pick(link.label, locale)}
              </a>
            ))}
            <CopyPageLink />
          </div>
        </div>

        {(older || newer) && (
          <nav className="post__nav" aria-label={labels.timeline}>
            {older ? (
              <a className="post__step" href={href(entryPath(older.id))}>
                <span className="post__step-k">{t('Older post')}</span>
                <span className="post__step-t">{pick(older.title, locale)}</span>
              </a>
            ) : (
              <span />
            )}
            {newer && (
              <a className="post__step post__step--newer" href={href(entryPath(newer.id))}>
                <span className="post__step-k">{t('Newer post')}</span>
                <span className="post__step-t">{pick(newer.title, locale)}</span>
              </a>
            )}
          </nav>
        )}
      </article>
      {zoomed && <Lightbox image={zoomed} locale={locale} onClose={() => setZoomed(null)} />}
    </PageChrome>
  )
}
