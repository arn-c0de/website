'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { searchProjects } from '@/lib/github'
import type { Project } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import type { Tab } from '@/lib/useAppState'
import { SearchIcon, StarIcon } from './Icons'

interface Command {
  id: string
  group: 'Navigate' | 'Projects' | 'Links'
  name: string
  hint?: string
  meta?: string
  run: () => void
}

/**
 * The topbar search: a button that expands into an inline input sliding out
 * to the left, with results in a dropdown anchored underneath — no modal.
 * ⌘K / Ctrl-K toggles it, "/" opens it, Escape and clicking outside close it.
 */
export default function TopSearch({
  projects,
  onNavigate,
  onOpenProject,
  onStartRequest,
}: {
  projects: Project[]
  onNavigate: (tab: Tab) => void
  onOpenProject: (name: string) => void
  onStartRequest: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const openSearch = useCallback(() => {
    setOpen(true)
    // Focus once the input exists; the width transition doesn't block focus.
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing =
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (open) close()
        else openSearch()
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        openSearch()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close, openSearch])

  // Clicking or tapping anywhere outside collapses the search again.
  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, close])

  const { t: tr, labels } = useI18n()
  const commands = useMemo<Command[]>(() => {
    const tabs: { tab: Tab; label: string; hint: string }[] = [
      { tab: 'overview', label: labels.overview, hint: tr('A bit of everything on one page') },
      { tab: 'projects', label: labels.projects, hint: tr('Browse the repository grid') },
      { tab: 'stack', label: labels.stack, hint: tr('Languages, domains and topics') },
      { tab: 'about', label: labels.about, hint: tr('Focus areas and working principles') },
      { tab: 'contact', label: labels.contact, hint: tr('SimpleX, email and PGP key') },
    ]

    const matched = searchProjects(projects, query).slice(0, 8)

    return [
      ...tabs.map<Command>((t) => ({
        id: `tab:${t.tab}`,
        group: 'Navigate',
        name: t.label,
        hint: t.hint,
        run: () => {
          onNavigate(t.tab)
          close()
        },
      })),
      ...matched.map<Command>((p) => ({
        id: `project:${p.name}`,
        group: 'Projects',
        name: p.title,
        hint: p.description ?? p.category,
        meta: `★ ${p.stargazers_count}`,
        run: () => {
          onOpenProject(p.name)
          close()
        },
      })),
      {
        id: 'action:request',
        group: 'Navigate',
        name: tr('Start a request'),
        hint: tr('Build an inquiry email to send'),
        run: () => {
          onStartRequest()
          close()
        },
      },
      {
        id: 'link:github',
        group: 'Links',
        name: tr('Open GitHub profile'),
        hint: 'github.com/arn-c0de',
        run: () => {
          window.open('https://github.com/arn-c0de', '_blank', 'noopener,noreferrer')
          close()
        },
      },
    ]
  }, [projects, query, onNavigate, onOpenProject, onStartRequest, close, tr, labels])

  // Tab entries are filtered by name, project entries are pre-filtered above.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.group === 'Projects' ||
        `${c.name} ${c.hint ?? ''}`.toLowerCase().includes(q),
    )
  }, [commands, query])

  useEffect(() => setActive(0), [query])

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    }
  }

  let lastGroup = ''

  return (
    <div className={`tsearch${open ? ' tsearch--open' : ''}`} ref={rootRef}>
      <input
        ref={inputRef}
        className="tsearch__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onInputKey}
        placeholder={tr('Search projects or jump to a section…')}
        aria-label={tr('Search projects and sections')}
        role="combobox"
        aria-expanded={open}
        aria-controls="tsearch-list"
        tabIndex={open ? 0 : -1}
      />

      <button
        type="button"
        className="iconbtn tsearch__toggle"
        onClick={() => (open ? close() : openSearch())}
        aria-label={open ? tr('Close search') : tr('Open search')}
        aria-expanded={open}
      >
        <SearchIcon />
        {!open && (
          <span
            className="kbd tsearch__hint"
            style={{ border: 0, background: 'none', padding: 0 }}
          >
            ⌘K
          </span>
        )}
      </button>

      {open && (
        <div className="tsearch__drop" role="dialog" aria-label={tr('Search results')}>
          {results.length === 0 ? (
            <div className="palette__empty">{tr('No matches for “{query}”', { query })}</div>
          ) : (
            <ul className="palette__list" id="tsearch-list" ref={listRef} role="listbox">
              {results.map((cmd, i) => {
                const showGroup = cmd.group !== lastGroup
                lastGroup = cmd.group
                return (
                  <li key={cmd.id}>
                    {showGroup && <div className="palette__group">{tr(cmd.group)}</div>}
                    <button
                      type="button"
                      className="palette__item"
                      data-active={i === active}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={cmd.run}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span className="palette__item-name">{cmd.name}</span>
                        {cmd.hint && <span className="palette__item-desc"> — {cmd.hint}</span>}
                      </span>
                      {cmd.meta && (
                        <span className="palette__item-meta">
                          <StarIcon /> {cmd.meta.replace('★ ', '')}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="palette__foot">
            <span>
              <span className="kbd">↑↓</span> {tr('navigate')}
            </span>
            <span>
              <span className="kbd">↵</span> {tr('open')}
            </span>
            <span>
              <span className="kbd">esc</span> {tr('close')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
