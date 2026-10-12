'use client'

import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
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
const WORKING = ['Kotlin', 'Python', 'C', 'C#']
/** Where the data ends up — the layer under every backend on this site. */
const STORAGE = ['PostgreSQL', 'MongoDB', 'SQLite', 'vector stores', 'plain files']
const LEARNING = ['Rust', 'C++']
export default function AboutPane({
  projects,
  onStartRequest,
}: {
  projects: Project[]
  onStartRequest: () => void
}) {
  const { t, href } = useI18n()
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
          <li>
            <strong>{t('Traceability web app')}</strong>
            <span>{t('for industrial environments')}</span>
          </li>
          <li>
            <strong>JobFinder</strong>
            <span>{t('ABOUT_JOBFINDER')}</span>
          </li>
          <li>
            <strong>ARIS</strong>
            <span>{t('ABOUT_ARIS')}</span>
          </li>
          <li>
            <strong>
              <a href={href('/deepvision/')}>DeepVision-Web</a>
            </strong>
            <span>{t('ABOUT_DEEPVISION')}</span>
          </li>
          <li>
            <strong>QLink</strong>
            <span>{t('Rust game and simulation engine for Linux and Quest 3')}</span>
          </li>
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
            <p className="band__hint">{t('Languages, data stores and focus areas.')}</p>
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

          <div className="fact" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <h3 className="section__title">{t('Works in')}</h3>
            <div className="tagrow">
              {WORKING.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
            <p className="fact__note">{t('C mostly on ESP32, SDR and Wi-Fi.')}</p>
          </div>

          <div className="fact" data-reveal style={{ '--i': 2 } as React.CSSProperties}>
            <h3 className="section__title">{t('Learning')}</h3>
            <div className="tagrow">
              {LEARNING.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
            <p className="fact__note">{t('C++ on Windows.')}</p>
          </div>

          <div className="fact" data-reveal style={{ '--i': 3 } as React.CSSProperties}>
            <h3 className="section__title">{t('Stores data in')}</h3>
            <div className="tagrow">
              {STORAGE.map((s) => (
                <span key={s} className="tag">
                  {t(s)}
                </span>
              ))}
            </div>
            <p className="fact__note">{t('Vector stores for RAG, SQLite when a file is enough.')}</p>
          </div>

          {/* Counted from the live repository data rather than listed by hand. */}
          <div
            className="fact fact--wide"
            data-reveal
            style={{ '--i': 5 } as React.CSSProperties}
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
