'use client'

import { useEffect, useMemo, useState } from 'react'
import config from '@/projects.config'
import { searchProjects, sortProjects } from '@/lib/github'
import type { Project, SortKey } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import ProjectCard from './ProjectCard'
import ProjectRow from './ProjectRow'
import { CloseIcon, SearchIcon } from './Icons'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Curated order' },
  { key: 'stars', label: 'Most stars' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'name', label: 'Name A–Z' },
]

export default function ProjectsPane({
  projects,
  query,
  onQueryChange,
  language,
  onLanguageChange,
  onOpen,
}: {
  projects: Project[]
  query: string
  onQueryChange: (q: string) => void
  /** Held by the shell, so the stack tab can arrive with one already picked. */
  language: string
  onLanguageChange: (language: string) => void
  onOpen: (name: string) => void
}) {
  const { t, labels } = useI18n()
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('featured')
  const [showAll, setShowAll] = useState(config.showAllByDefault)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // The chosen view is a reading preference, so it outlives the visit.
  useEffect(() => {
    try {
      if (localStorage.getItem('projects-view') === 'list') setView('list')
    } catch {
      /* storage blocked — the grid it is */
    }
  }, [])

  function chooseView(next: 'grid' | 'list') {
    setView(next)
    try {
      localStorage.setItem('projects-view', next)
    } catch {
      /* storage blocked — the choice lasts for this visit */
    }
  }

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of projects) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [projects])

  const languages = useMemo(
    () => [...new Set(projects.map((p) => p.language).filter(Boolean))].sort() as string[],
    [projects],
  )

  // A search or an explicit filter always searches everything, otherwise the
  // curated set is what the visitor sees first.
  const filtersActive = query.trim() !== '' || category !== 'all' || language !== 'all'
  const pool = showAll || filtersActive ? projects : projects.filter((p) => p.featured)

  const visible = useMemo(() => {
    let list = pool
    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (language !== 'all') list = list.filter((p) => p.language === language)
    return sortProjects(searchProjects(list, query), sort)
  }, [pool, category, language, query, sort])

  const hiddenCount = projects.length - projects.filter((p) => p.featured).length

  function reset() {
    onQueryChange('')
    setCategory('all')
    onLanguageChange('all')
  }

  return (
    <div className="pane">
      <div className="pane__head">
        <h1 className="pane__title">{labels.projects}</h1>
        <p className="pane__lede">{t('PROJECTS_LEDE')}</p>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="search__icon">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('Search projects, topics, languages…')}
            aria-label={t('Search projects')}
          />
          {query && (
            <button type="button" className="search__clear" onClick={() => onQueryChange('')} aria-label={t('Clear search')}>
              <CloseIcon />
            </button>
          )}
        </div>

        <select
          className="select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label={t('Filter by language')}
        >
          <option value="all">{t('All languages')}</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label={t('Sort projects')}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {t(s.label)}
            </option>
          ))}
        </select>

        <div className="viewtoggle" role="group" aria-label={t('Project view')}>
          <button type="button" aria-pressed={view === 'grid'} onClick={() => chooseView('grid')}>
            {t('Grid')}
          </button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => chooseView('list')}>
            {t('List')}
          </button>
        </div>
      </div>

      <div className="chips">
        <button
          type="button"
          className="chip"
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          {t('All')}
          <span className="chip__n">{projects.length}</span>
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className="chip"
            aria-pressed={category === name}
            onClick={() => setCategory(category === name ? 'all' : name)}
          >
            {t(name)}
            <span className="chip__n">{count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>{t('No project matches those filters.')}</p>
          <button type="button" className="btn" onClick={reset}>
            {t('Reset filters')}
          </button>
        </div>
      ) : view === 'list' ? (
        <ul className="plist">
          {visible.map((p) => (
            <ProjectRow key={p.name} project={p} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <div className="grid">
          {visible.map((p, i) => (
            <ProjectCard
              key={p.name}
              project={p}
              index={i}
              onOpen={onOpen}
              showFeaturedBadge={showAll || filtersActive}
            />
          ))}
        </div>
      )}

      {!showAll && !filtersActive && hiddenCount > 0 && (
        <div className="showall">
          <button type="button" className="btn" onClick={() => setShowAll(true)}>
            {t('Show all {n} projects', { n: projects.length })}
            <span className="chip__n">+{hiddenCount}</span>
          </button>
        </div>
      )}
    </div>
  )
}
