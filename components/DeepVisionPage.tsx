'use client'

import { asset } from '@/lib/basePath'
import { I18nProvider, useI18n, type Locale } from '@/lib/i18n'
import { RequestIcon } from './Icons'
import PageChrome, { CopyPageLink } from './PageChrome'

/**
 * DeepVision-Web: a private project, so this page is the only public view of
 * it — what it does, what is being worked on, and where it stands. Code,
 * data and internal details stay out on purpose.
 */
export default function DeepVisionPage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Content />
    </I18nProvider>
  )
}

const STEPS = [
  { title: 'Recognize', text: 'DV_STEP_RECOGNIZE' },
  { title: 'Overlay', text: 'DV_STEP_OVERLAY' },
  { title: 'Deep Zoom', text: 'DV_STEP_ZOOM' },
  { title: 'Inspect', text: 'DV_STEP_INSPECT' },
] as const

const FOCUS = ['DV_FOCUS_GRID', 'DV_FOCUS_FUSION', 'DV_FOCUS_MODEL', 'DV_FOCUS_REVIEW', 'DV_FOCUS_SIDE'] as const

const PRINCIPLES = [
  { title: 'Stays local', text: 'DV_PRINCIPLE_LOCAL' },
  { title: 'Honest numbers', text: 'DV_PRINCIPLE_HONEST' },
  { title: 'An aid, not a sign-off', text: 'DV_PRINCIPLE_AID' },
] as const

const STATUS = [
  { part: 'Board recognition and overlay', state: 'Working', tone: 'done' },
  { part: 'Deep Zoom with stabilized tracking', state: 'Working', tone: 'done' },
  { part: 'FastAOI with Deep Zoom', state: 'DV_STATE_AOI', tone: 'now' },
  { part: 'Automatic top/bottom detection', state: 'Draft', tone: 'now' },
  { part: 'Own component model', state: 'Planned', tone: 'planned' },
] as const

const TECH = ['WebAssembly', 'OpenCV', 'Emscripten', 'Web Worker', 'WebGL2', 'Node.js', 'ONNX', 'Ollama']

function Content() {
  const { t, labels, href } = useI18n()
  const home = href('/')

  return (
    <PageChrome
      back={{ href: home, label: labels.overview }}
      action={
        <a
          className="btn btn--request btn--sm"
          href={`${home}?request=1&for=DeepVision-Web`}
          aria-label={t('Ask about this')}
        >
          <RequestIcon />
          <span className="btn__label">{t('Ask about this')}</span>
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
            <h1 className="pp-head__title">
              <img
                className="dvp__logo themed-light"
                src={asset('/projects/deepvision/logo-light.svg')}
                alt="DeepVision-Web"
                width={340}
                height={43}
              />
              <img
                className="dvp__logo themed-dark"
                src={asset('/projects/deepvision/logo-dark.svg')}
                alt="DeepVision-Web"
                width={340}
                height={43}
              />
            </h1>
            <p className="pp-head__lede">{t('DV_LEDE')}</p>
          </div>
        </header>

        <div className="pp-actions">
          <a className="btn" href={`${home}?request=1&for=DeepVision-Web`}>
            <RequestIcon />
            {t('Ask about this')}
          </a>
          <CopyPageLink />
        </div>

        <p className="callout dvp__private" role="note">
          <strong>{t('Private project.')}</strong> {t('DV_PRIVATE')}
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
          <h2 className="pp-label">{t('Current focus')}</h2>
          <p className="dvp__lead">{t('DV_FOCUS')}</p>
          <ul className="dvp__list">
            {FOCUS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
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
          <p className="qlp__note">{t('DV_STATUS_NOTE')}</p>
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
