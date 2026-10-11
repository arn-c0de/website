'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const TABS = ['overview', 'projects', 'timeline', 'stack', 'about', 'contact'] as const

/** The tab a bare URL lands on; also the one omitted from the query string. */
const DEFAULT_TAB: Tab = 'overview'
export type Tab = (typeof TABS)[number]

export interface AppState {
  tab: Tab
  /** Repo name of the open detail panel, or null when nothing is open. */
  project: string | null
  /** Whether the request modal is open. */
  request: boolean
  /** Repo names pre-attached to the request, so a prepared link can be shared. */
  requestFor: string[]
}

function parse(search: string): AppState {
  const params = new URLSearchParams(search)
  const tab = params.get('tab') as Tab | null
  const forParam = params.get('for')
  // `?tab=request` was the old address of the request form; keep those links
  // working now that it is a modal rather than a tab.
  const legacyRequestTab = params.get('tab') === 'request'
  return {
    tab: tab && TABS.includes(tab) ? tab : DEFAULT_TAB,
    project: params.get('p'),
    request: params.get('request') === '1' || legacyRequestTab,
    requestFor: forParam ? forParam.split(',').filter(Boolean) : [],
  }
}

function serialise(state: AppState): string {
  const params = new URLSearchParams()
  if (state.tab !== DEFAULT_TAB) params.set('tab', state.tab)
  if (state.project) params.set('p', state.project)
  if (state.request) params.set('request', '1')
  if (state.requestFor.length) params.set('for', state.requestFor.join(','))
  const query = params.toString()
  return query ? `?${query}` : location.pathname
}

/**
 * Tab, panel and modal state kept in the URL query string, so every view is
 * linkable and the browser's back button behaves the way it does in an app.
 * Query params rather than routes — a static host has no server to resolve
 * deep paths on a hard refresh.
 */
export function useAppState(): [AppState, (next: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>({
    tab: DEFAULT_TAB,
    project: null,
    request: false,
    requestFor: [],
  })

  // The latest state, readable outside a render. `navigate` merges against
  // this rather than from inside a setState updater: Next patches
  // `history.pushState` to drive its own router, and calling it from an
  // updater — which React runs while rendering — updates the router mid-render.
  const latest = useRef(state)
  latest.current = state

  // Read the URL after mount; the server-rendered HTML has no query string.
  useEffect(() => {
    setState(parse(location.search))
    const onPop = () => setState(parse(location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: Partial<AppState>) => {
    const merged = { ...latest.current, ...next }
    // Written straight away so two calls in one event build on each other.
    latest.current = merged
    history.pushState(null, '', serialise(merged))
    setState(merged)
  }, [])

  return [state, navigate]
}
