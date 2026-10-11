'use client'

import { useMemo, useState } from 'react'
import { commitSummary, commitWeeks, weeksSince } from '@/lib/commits'
import { languageShare, monthlyActivity, projectSpans } from '@/lib/stats'
import type { Project } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import Metric from './Metric'
import { ActivityChart, CommitChart, LanguageBars, SpanChart } from './Charts'

/**
 * Everything here is aggregated from the live repo data — no hand-maintained
 * list to drift out of date. Push a repo in a new language and it shows up.
 *
 * Picking a language, a topic or a lane carries on into the rest of the site
 * rather than dead-ending on this tab.
 */
type Range = 6 | 12 | 'all'
const RANGES: Range[] = [6, 12, 'all']

export default function StackPane({
  projects,
  onTopicSelect,
  onLanguageSelect,
  onOpenProject,
}: {
  projects: Project[]
  onTopicSelect: (topic: string) => void
  onLanguageSelect: (language: string) => void
  onOpenProject: (name: string) => void
}) {
  const { t, locale } = useI18n()
  const [range, setRange] = useState<Range>(12)

  const stats = useMemo(() => {
    const topics = new Map<string, number>()
    const categories = new Map<string, number>()
    let stars = 0

    for (const p of projects) {
      stars += p.stargazers_count
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1)
      for (const t of p.topics) topics.set(t, (topics.get(t) ?? 0) + 1)
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    const languages = languageShare(projects)
    const months = monthlyActivity(projects)

    return {
      stars,
      languages,
      months,
      spans: projectSpans(projects),
      peak: Math.max(0, ...months.map((m) => m.active)),
      categories: sortDesc(categories),
      topics: sortDesc(topics).filter(([, n]) => n > 1),
    }
  }, [projects])

  // The slice of the timeline the range picks: the last N months of
  // activity, the lanes still running inside them, and the commit weeks.
  const scoped = useMemo(() => {
    const months = range === 'all' ? stats.months : stats.months.slice(-range)
    const since = months[0]?.at ?? 0
    // GitHub keeps a year of weekly commit counts; "everything" is that year.
    const weeks = weeksSince(commitWeeks(), since)
    return {
      months,
      spans: stats.spans.filter((s) => s.to >= since),
      weeks,
      commits: commitSummary(weeks),
    }
  }, [stats, range])

  return (
    <div className="pane stack-pane">
      <div className="pane__head">
        <h1 className="pane__title">Stack</h1>
        <p className="pane__lede">{t('STACK_LEDE')}</p>
      </div>

      <div className="metrics" data-reveal>
        <Metric value={projects.length} label={t('Projects')} />
        <Metric value={stats.stars} label={t('Stars')} />
        <Metric value={stats.languages.length} label={t('Languages')} />
        <Metric value={stats.peak} label={t('Peak at once')} />
      </div>

      <section className="section">
        <h2 className="section__title">{t('Languages')}</h2>
        <p className="section__hint">{t('STACK_LANG_HINT')}</p>

        <LanguageBars slices={stats.languages} onSelect={onLanguageSelect} />
      </section>

      <section className="section">
        <h2 className="section__title">{t('Domains')}</h2>
        <div className="domain-grid">
          {stats.categories.map(([name, count], i) => (
            <div
              key={name}
              className="domain-card"
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className="domain-card__name">{t(name)}</span>
              <span className="domain-card__count" title={t(count === 1 ? '{n} project' : '{n} projects', { n: count })}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">{t('Topics used more than once')}</h2>
        <div className="cloud">
          {stats.topics.map(([topic, count], i) => (
            <button
              key={topic}
              type="button"
              className="cloud__tag"
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
              onClick={() => onTopicSelect(topic)}
              title={t('Show projects tagged {topic}', { topic })}
            >
              {topic}
              <b>{count}</b>
            </button>
          ))}
        </div>
      </section>

      {/* One time range for everything below it that runs over time. */}
      <div className="rangebar" data-reveal>
        <span className="rangebar__label">{t('Time range')}</span>
        <div className="viewtoggle" role="group" aria-label={t('Time range')}>
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
              {r === 'all' ? t('Everything') : t('{n} months', { n: r })}
            </button>
          ))}
        </div>
      </div>

      {scoped.weeks.length > 0 && (
        <section className="section">
          <h2 className="section__title">{t('Commits per week')}</h2>
          <p className="section__hint">
            {t('COMMITS_HINT', {
              total: scoped.commits.total,
              perWeek: String(scoped.commits.perWeek).replace('.', locale === 'de' ? ',' : '.'),
            })}
          </p>
          <CommitChart weeks={scoped.weeks} />
        </section>
      )}

      <section className="section">
        <h2 className="section__title">{t('Activity')}</h2>
        <p className="section__hint">{t('STACK_ACTIVITY_HINT')}</p>
        <ActivityChart months={scoped.months} />
      </section>

      <section className="section">
        <h2 className="section__title">{t('Project timeline')}</h2>
        <p className="section__hint">{t('STACK_TIMELINE_HINT')}</p>
        <SpanChart spans={scoped.spans} months={scoped.months} onOpen={onOpenProject} />
      </section>

    </div>
  )
}
