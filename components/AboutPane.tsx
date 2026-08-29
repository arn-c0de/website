'use client'

import { asset } from '@/lib/basePath'
import type { Project } from '@/lib/types'
import { GitHubIcon, LanguageIcon, RequestIcon } from './Icons'

export const PRINCIPLES = [
  {
    title: 'Local by default',
    body: 'If something can run on your machine, it should. Fewer accounts, fewer uploads, less data leaving your hands.',
  },
  {
    title: 'Security that stays honest',
    body: 'When a security check cannot do its job, the tool stops and tells you. Quietly pretending everything is fine is never the fallback.',
  },
  {
    title: 'The whole path',
    body: 'From firmware on a microcontroller to the connection in between and the app that makes it useful — I like building things end to end.',
  },
  {
    title: 'Clear beats clever',
    body: 'Readable code, a short dependency list, setup notes that actually help. If you need to trust a tool, you should be able to understand it.',
  },
]

const FOCUS = [
  'industrial traceability',
  'web applications',
  'ARIS agent',
  'FLUID UI systems',
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
            <span className="profile__now">Freelance</span>
            Embedded systems, backends, apps and AI
          </p>
          <p className="profile__lede">
            I build complete systems from firmware and hardware to the backends, databases and apps
            people use. I also work on local LLM and RAG systems, and on game AI for deterministic,
            replayable simulations.
          </p>
          <div className="profile__meta">
            <span className="tag">{projects.length} public repositories</span>
            <span className="tag">German · English</span>
            <span className="tag">open for work</span>
          </div>
        </div>
      </header>

      {/* Four labelled bands rather than one running page: what I do, why it
          exists, what I use, how I work. */}
      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">What I do</h2>
            <p className="band__hint">Freelance software development, backed by hands-on electronics.</p>
          </div>
        </div>

        <div className="roles">
          <article className="role" data-reveal>
            <span className="role__tag">Training</span>
            <h3 className="role__title">Electronics technician for devices and systems</h3>
            <p className="role__text">
              Practical training in building, measuring and troubleshooting electronic devices.
            </p>
          </article>

          <article className="role role--lead" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <span className="role__tag role__tag--lead">Freelance &amp; personal</span>
            <h3 className="role__title">Embedded, backends, apps, AI</h3>
            <p className="role__text">
              I develop a traceability web app for industrial environments and ARIS, a self-hosted
              agent with fluid synthetic voice, multi-model support and a harness for tools and file
              edits. Firmware, backends, databases, local LLM/RAG systems and game AI are part of
              the wider toolkit. Open for collaboration and contributions.
            </p>
          </article>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">Why any of this exists</h2>
            <p className="band__hint">Scratching my own itch, then cleaning it up.</p>
          </div>
        </div>

        <div className="slab slab--prose" data-reveal>
          <div className="prose">
            <p>
              Most of what you find here started as something I wanted for myself — an encrypted
              mesh link, a better way to dig through research, a live view of SSH attempts on a
              server. If the result might save someone else a few evenings, I clean it up and put it
              on GitHub.
            </p>
            <p>
              The code is public, the setup is documented, and sensitive data stays where it
              belongs: on your device. No account or cloud detour unless a project genuinely needs
              one.
            </p>
          </div>

          <div className="slab__side">
            <p className="slab__note">
              Need a hand with something, want to work on it together, or would like to contribute?
              Write to me, or open an issue in the repository itself.
            </p>
            <div className="slab__actions">
              <button type="button" className="btn btn--request btn--sm" onClick={onStartRequest}>
                <RequestIcon />
                Start a request
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
            <h2 className="band__title">Toolbox</h2>
            <p className="band__hint">
              What I reach for, and what the repositories are actually written in.
            </p>
          </div>
        </div>

        <div className="facts">
          <div className="fact" data-reveal>
            <h3 className="section__title">Focus</h3>
            <div className="tagrow">
              {FOCUS.map((f) => (
                <span key={f} className="tag">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="fact" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <h3 className="section__title">Works in</h3>
            <div className="tagrow">
              {WORKING.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
            <p className="fact__note">C mostly on ESP32, SDR and Wi-Fi.</p>
          </div>

          <div className="fact" data-reveal style={{ '--i': 2 } as React.CSSProperties}>
            <h3 className="section__title">Learning</h3>
            <div className="tagrow">
              {LEARNING.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
            <p className="fact__note">C++ on Windows.</p>
          </div>

          <div className="fact" data-reveal style={{ '--i': 3 } as React.CSSProperties}>
            <h3 className="section__title">Stores data in</h3>
            <div className="tagrow">
              {STORAGE.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
            <p className="fact__note">Vector stores for RAG, SQLite when a file is enough.</p>
          </div>

          {/* Counted from the live repository data rather than listed by hand. */}
          <div className="fact" data-reveal style={{ '--i': 4 } as React.CSSProperties}>
            <h3 className="section__title">In the repositories</h3>
            <div className="tagrow">
              {languages.map((l) => (
                <span key={l} className="tag tag--language">
                  <LanguageIcon language={l} size={16} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="fact" data-reveal style={{ '--i': 5 } as React.CSSProperties}>
            <h3 className="section__title">Speaks</h3>
            <div className="tagrow">
              {SPOKEN.map(([lang, level]) => (
                <span key={lang} className="tag">
                  {lang}
                  <span className="tag__n">{level}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band__head">
          <div>
            <h2 className="band__title">A few things I care about</h2>
            <p className="band__hint">The rules of thumb every project here follows.</p>
          </div>
        </div>

        <div className="principles">
          {PRINCIPLES.map((p, i) => (
            <article
              key={p.title}
              className="principle"
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
            >
              <h3 className="principle__title">
                <span className="principle__n">{String(i + 1).padStart(2, '0')}</span>
                {p.title}
              </h3>
              <p className="principle__body">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
