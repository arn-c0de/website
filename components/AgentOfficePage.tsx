'use client'

import { I18nProvider, useI18n, type Locale } from '@/lib/i18n'
import { RequestIcon } from './Icons'
import PageChrome, { CopyPageLink } from './PageChrome'

/**
 * Agent Office: a private project, so this page is the only public view of
 * it — what it does, where it stands and how to get a test version. Code,
 * paths, hosts, accounts and internal plan details stay out on purpose.
 */
export default function AgentOfficePage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Content />
    </I18nProvider>
  )
}

const REQUEST_FOR = 'Agent-Office-private'

const STEPS = [
  { title: 'Assign', text: 'AO_STEP_ASSIGN' },
  { title: 'Isolate', text: 'AO_STEP_ISOLATE' },
  { title: 'Approve', text: 'AO_STEP_APPROVE' },
  { title: 'Watch', text: 'AO_STEP_WATCH' },
] as const

const WORLD = ['AO_WORLD_NEEDS', 'AO_WORLD_CITY', 'AO_WORLD_FREE', 'AO_WORLD_ORDERS', 'AO_WORLD_SOCIAL'] as const

const PRINCIPLES = [
  { title: 'Fails closed', text: 'AO_PRINCIPLE_CLOSED' },
  { title: 'A person decides', text: 'AO_PRINCIPLE_APPROVE' },
  { title: 'Stays on the LAN', text: 'AO_PRINCIPLE_LOCAL' },
] as const

const STATUS = [
  { part: 'Server and browser app', state: 'Working', tone: 'done' },
  { part: 'Isolated workspaces and brokered commits', state: 'Working', tone: 'done' },
  { part: 'Approvals, budgets and usage windows', state: 'Working', tone: 'done' },
  { part: 'Safety and provider verification', state: 'Not passed yet', tone: 'now' },
  { part: 'Agent World: needs, money, city', state: 'AO_STATE_BUILT', tone: 'now' },
  { part: 'Agent World: workday, free time, own decisions', state: 'AO_STATE_BUILT', tone: 'now' },
  { part: 'Agent World: thinking, emotions, relationships', state: 'Planned', tone: 'planned' },
] as const

const TECH = ['TypeScript', 'Node.js', 'Fastify', 'WebSocket', 'React', 'PixiJS', 'SQLite', 'Vitest', 'PWA']

function Content() {
  const { t, labels, href } = useI18n()
  const home = href('/')
  const request = `${home}?request=1&for=${REQUEST_FOR}`

  return (
    <PageChrome
      back={{ href: home, label: labels.overview }}
      action={
        <a className="btn btn--request btn--sm" href={request} aria-label={t('Request a test version')}>
          <RequestIcon />
          <span className="btn__label">{t('Request a test version')}</span>
        </a>
      }
    >
      <article className="pane dvp">
        <header className="pp-head">
          <div className="pp-head__text">
            <p className="pp-head__kicker">
              {t('Currently building')}
              <span className="card__flag card__flag--private">{t('private')}</span>
            </p>
            <h1 className="pp-head__title">Agent Office</h1>
            <p className="pp-head__lede">{t('AO_LEDE')}</p>
          </div>
        </header>

        <div className="pp-actions">
          <a className="btn" href={request}>
            <RequestIcon />
            {t('Request a test version')}
          </a>
          <CopyPageLink />
        </div>

        <p className="callout dvp__private" role="note">
          <strong>{t('Private project.')}</strong> {t('AO_PRIVATE')}
        </p>

        <section className="qlp__section">
          <h2 className="pp-label">{t('How it works')}</h2>
          <ol className="dvp__steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="dvp__step">
                <span className="dvp__num" aria-hidden>
                  {i + 1}
                </span>
                <span className="dvp__step-title">{t(step.title)}</span>
                <span className="dvp__step-text">{t(step.text)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="qlp__section">
          <h2 className="pp-label">Agent World</h2>
          <p className="dvp__lead">{t('AO_WORLD')}</p>
          <ul className="dvp__list">
            {WORLD.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <p className="qlp__note">{t('AO_WORLD_NOTE')}</p>
        </section>

        <section className="qlp__section">
          <h2 className="pp-label">{t('Principles')}</h2>
          <div className="dvp__cards">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="dvp__card">
                <span className="dvp__card-title">{t(p.title)}</span>
                <p>{t(p.text)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="qlp__section">
          <h2 className="pp-label">{t('Where it stands')}</h2>
          <ul className="dvp__status">
            {STATUS.map((s) => (
              <li key={s.part}>
                <span className={`tl-dot tl-dot--${s.tone}`} aria-hidden />
                <span className="dvp__status-part">{t(s.part)}</span>
                <span className="dvp__status-state">{t(s.state)}</span>
              </li>
            ))}
          </ul>
          <p className="qlp__note">{t('AO_STATUS_NOTE')}</p>
        </section>

        <section className="qlp__section">
          <h2 className="pp-label">{t('Built with')}</h2>
          <span className="tagrow">
            {TECH.map((name) => (
              <span key={name} className="tag">
                {name}
              </span>
            ))}
          </span>
        </section>
      </article>
    </PageChrome>
  )
}
