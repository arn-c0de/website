'use client'

import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
import { pick } from '@/lib/timeline'
import { now } from '@/now.config'
import type { Project } from '@/lib/types'
import { GitHubIcon, LanguageIcon, RequestIcon } from './Icons'

const FOCUS = [
  'web applications',
  'backends & APIs',
  'industrial traceability',
  'embedded systems',
  'android',
  'llm & rag systems',
  'databases & vector search',
  'game AI',
]
export default function AboutPane({
  projects,
  onStartRequest,
}: {
  projects: Project[]
  onStartRequest: () => void
}) {
  const { t, href, locale } = useI18n()
  const languages = [...new Set(projects.map((p) => p.language).filter(Boolean))] as string[]

  return (
    <div className="pane about">
      {/* A profile header rather than a page title — the tab already says
          About, and a face says more than the word does. */}
      <header className="profile">
        <img
          className="profile__avatar"
          src={asset('/avatar-large.jpg')}
          alt="arn-c0de"
          width={112}
          height={112}
        />
        <div className="profile__text">
          <h1 className="profile__name">arn-c0de</h1>
          <p className="profile__role">
            {t('Web apps, backends, embedded systems and AI')}
          </p>
          <p className="profile__lede">{t('ABOUT_LEDE')}</p>
          <div className="profile__meta">
            <span className="tag">{t('{n} public repositories', { n: projects.length })}</span>
            <span className="tag">{t('German · English')}</span>
          </div>
        </div>
      </header>

      {/* Four labelled bands rather than one running page: what I do, why it
          exists, what I use, how I work. */}
      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('Current projects')}</h2>
            <p className="band__hint">{t('ABOUT_WEB_FOCUS')}</p>
          </div>
        </div>

        <ul className="worklist" data-reveal>
          {now.items
            .filter((item) => item.about)
            .map((item) => {
              const name = pick(item.name, locale)
              return (
                <li key={name}>
                  <strong>{item.href ? <a href={href(item.href)}>{name}</a> : name}</strong>
                  <span>{pick(item.about, locale)}</span>
                </li>
              )
            })}
        </ul>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('About the projects')}</h2>
          </div>
        </div>

        <div className="slab slab--prose" data-reveal>
          <div className="prose">
            <p>{t('ABOUT_WHY')}</p>
          </div>

          <div className="slab__side">
            <p className="slab__note">{t('ABOUT_NOTE')}</p>
            <div className="slab__actions">
              <button type="button" className="btn btn--request btn--sm" onClick={onStartRequest}>
                <RequestIcon />
                {t('Start a request')}
              </button>
              <a
                className="btn btn--sm"
                href="https://github.com/arn-c0de"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon size={14} />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('Toolbox')}</h2>
            <p className="band__hint">{t('Focus areas and the languages in the repositories.')}</p>
          </div>
        </div>

        <div className="facts">
          <div className="fact fact--focus" data-reveal>
            <h3 className="section__title">{t('Focus')}</h3>
            <div className="tagrow">
              {FOCUS.map((f) => (
                <span key={f} className="tag">
                  {t(f)}
                </span>
              ))}
            </div>
          </div>

          {/* Counted from the live repository data rather than listed by hand. */}
          <div
            className="fact fact--wide"
            data-reveal
            style={{ '--i': 1 } as React.CSSProperties}
          >
            <h3 className="section__title">{t('In the repositories')}</h3>
            <div className="tagrow">
              {languages.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
