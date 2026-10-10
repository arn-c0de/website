'use client'

import { asset } from '@/lib/basePath'
import { useI18n } from '@/lib/i18n'
import type { Project } from '@/lib/types'
import { GitHubIcon, LanguageIcon, RequestIcon } from './Icons'

const FOCUS = [
  'industrial traceability',
  'web applications',
  'ARIS agent',
  'FLUID UI systems',
  'on-device PCB vision',
  'embedded systems',
  'backend deployment',
  'server integration',
  'android',
  'web apps',
  'llm & rag systems',
  'databases & vector search',
  'npc goal systems',
  'round-based rpg combat',
]
const WORKING = ['Kotlin', 'Python', 'C', 'C#']
/** Where the data ends up — the layer under every backend on this site. */
const STORAGE = ['PostgreSQL', 'MongoDB', 'SQLite', 'vector stores', 'plain files']
const LEARNING = ['Rust', 'C++']
const SPOKEN = [
  ['German', 'native'],
  ['English', 'fluent'],
]

export default function AboutPane({
  projects,
  onStartRequest,
}: {
  projects: Project[]
  onStartRequest: () => void
}) {
  const { t } = useI18n()
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
            <span className="profile__now">{t('Freelance')}</span>
            {t('Embedded systems, backends, apps and AI')}
          </p>
          <p className="profile__lede">{t('ABOUT_LEDE')}</p>
          <div className="profile__meta">
            <span className="tag">{t('{n} public repositories', { n: projects.length })}</span>
            <span className="tag">{t('German · English')}</span>
            <span className="tag">{t('open for work')}</span>
          </div>
        </div>
      </header>

      {/* Four labelled bands rather than one running page: what I do, why it
          exists, what I use, how I work. */}
      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('What I do')}</h2>
            <p className="band__hint">{t('Freelance software development, backed by hands-on electronics.')}</p>
          </div>
        </div>

        <div className="roles">
          <article className="role role--lead" data-reveal>
            <span className="role__tag role__tag--lead">{t('Freelance & personal')}</span>
            <h3 className="role__title">{t('Embedded, backends, apps, AI')}</h3>
            <ul className="role__list">
              <li>
                <strong>{t('Traceability web app')}</strong> {t('for industrial environments.')}
              </li>
              <li>
                <strong>ARIS</strong> — {t('ABOUT_ARIS')}
              </li>
              <li>
                <strong>DeepVision-Web</strong> — {t('ABOUT_DEEPVISION')}
              </li>
            </ul>
            <p className="role__text">{t('ABOUT_TOOLKIT')}</p>
          </article>

          <article className="role" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <span className="role__tag">{t('Training')}</span>
            <h3 className="role__title">{t('Electronics technician for devices and systems')}</h3>
            <p className="role__text">{t('ABOUT_TRAINING')}</p>
            <div className="tagrow role__tags">
              <span className="tag">{t('building')}</span>
              <span className="tag">{t('measuring')}</span>
              <span className="tag">{t('troubleshooting')}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">{t('Why any of this exists')}</h2>
            <p className="band__hint">{t('Scratching my own itch, then cleaning it up.')}</p>
          </div>
        </div>

        <div className="slab slab--prose" data-reveal>
          <div className="prose">
            <p>{t('ABOUT_WHY_1')}</p>
            <p>{t('ABOUT_WHY_2')}</p>
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
            <p className="band__hint">{t('What I reach for, and what the repositories are actually written in.')}</p>
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

          <div className="fact" data-reveal style={{ '--i': 4 } as React.CSSProperties}>
            <h3 className="section__title">{t('Speaks')}</h3>
            <div className="tagrow">
              {SPOKEN.map(([lang, level]) => (
                <span key={lang} className="tag">
                  {t(lang)}
                  <span className="tag__n">{t(level)}</span>
                </span>
              ))}
            </div>
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
