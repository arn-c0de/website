'use client'

import type { Project } from '@/lib/types'
import { formatRelative } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { LanguageIcon, StarIcon } from './Icons'

/**
 * One line of the projects list: the same project a card shows, read across
 * instead of down. Opens the detail panel like a card does.
 */
export default function ProjectRow({ project, onOpen }: { project: Project; onOpen: (name: string) => void }) {
  const { t, locale } = useI18n()

  return (
    <li>
      <button
        type="button"
        className="prow"
        onClick={() => onOpen(project.name)}
        aria-label={t('Open details for {name}', { name: project.title })}
      >
        {project.icon ? (
          <img className="prow__icon" src={project.icon} alt="" width={24} height={24} />
        ) : project.language ? (
          <span className="prow__icon prow__icon--language">
            <LanguageIcon language={project.language} size={16} />
          </span>
        ) : (
          <span className="prow__icon prow__icon--mono" aria-hidden>
            {project.title.charAt(0)}
          </span>
        )}
        <span className="prow__main">
          <span className="prow__title">
            {project.title}
            {project.status !== 'active' && (
              <span className={`card__flag card__flag--${project.status}`}>{t(project.status)}</span>
            )}
          </span>
          {project.description && <span className="prow__desc">{project.description}</span>}
        </span>
        <span className="prow__lang">{project.language ?? ''}</span>
        <span className="prow__stars">
          <StarIcon />
          {project.stargazers_count}
        </span>
        <span className="prow__when">{project.pushed_at ? formatRelative(project.pushed_at, locale) : '—'}</span>
      </button>
    </li>
  )
}
