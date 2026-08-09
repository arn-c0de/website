import config from '@/projects.config'
import snapshot from '@/data/repos.json'
import repoIcons from '@/data/repo-icons.json'
import { asset } from './basePath'
import type { DataSource, GitHubRepo, Project, SortKey } from './types'

const API = 'https://api.github.com'

const ICONS = new Set(repoIcons as string[])

/** Matches the slug `scripts/generate-repo-icons.mjs` writes the files under. */
function iconFor(name: string): string | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return ICONS.has(key) ? asset(`/repo-icons/${key}.png`) : null
}

/** GitHub descriptions often carry stray double spaces and newlines. */
function tidy(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

function inferCategory(repo: GitHubRepo): string {
  const signals = [...repo.topics, repo.language ?? '']
  for (const category of config.categories) {
    if (category.match.some((m) => signals.includes(m))) return category.name
  }
  return config.fallbackCategory
}

function toProject(repo: GitHubRepo): Project {
  const override = config.overrides[repo.name] ?? {}
  const featuredIndex = config.featured.indexOf(repo.name)
  return {
    ...repo,
    description: tidy(override.description ?? repo.description) || null,
    topics: override.topics ?? repo.topics,
    title: override.title ?? repo.name,
    category: override.category ?? inferCategory(repo),
    featured: featuredIndex !== -1,
    links: override.links ?? [],
    icon: iconFor(repo.name),
  }
}

function isVisible(repo: GitHubRepo): boolean {
  if (config.hidden.includes(repo.name)) return false
  if (config.overrides[repo.name]?.hidden) return false
  if (config.overrides[repo.name]?.show) return true
  if (repo.fork && !config.showForks) return false
  if (repo.archived && !config.showArchived) return false
  return true
}

/**
 * The GitHub payload is much larger than what we render; normalising it here
 * keeps the snapshot file and the live response the same shape.
 */
function normalise(raw: Record<string, unknown>): GitHubRepo {
  const license = raw.license as { spdx_id?: string } | null
  return {
    name: String(raw.name),
    full_name: String(raw.full_name ?? ''),
    description: (raw.description as string) ?? null,
    html_url: String(raw.html_url ?? ''),
    homepage: (raw.homepage as string) || null,
    language: (raw.language as string) ?? null,
    stargazers_count: Number(raw.stargazers_count ?? 0),
    forks_count: Number(raw.forks_count ?? 0),
    topics: (raw.topics as string[]) ?? [],
    fork: Boolean(raw.fork),
    archived: Boolean(raw.archived),
    pushed_at: String(raw.pushed_at ?? ''),
    created_at: String(raw.created_at ?? ''),
    license: license?.spdx_id ?? null,
  }
}

export interface ProjectsResult {
  projects: Project[]
  source: DataSource
}

/**
 * The committed snapshot, built synchronously. Used as the initial render so
 * the prerendered HTML carries real project data instead of empty skeletons —
 * the live fetch then replaces it once it lands.
 */
export function snapshotProjects(): Project[] {
  return build(snapshot as GitHubRepo[])
}

/**
 * Live repo data with a baked-in fallback. The API allows 60 unauthenticated
 * requests per hour per IP; when that runs out — or the visitor is offline —
 * the snapshot committed to the repo is used instead, so the grid is never empty.
 */
export async function loadProjects(signal?: AbortSignal): Promise<ProjectsResult> {
  try {
    const res = await fetch(
      `${API}/users/${config.username}/repos?per_page=100&sort=updated`,
      { signal, headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`)
    const raw = (await res.json()) as Record<string, unknown>[]
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('empty repo list')
    return { projects: build(raw.map(normalise)), source: 'live' }
  } catch {
    return { projects: build(snapshot as GitHubRepo[]), source: 'snapshot' }
  }
}

function build(repos: GitHubRepo[]): Project[] {
  return repos.filter(isVisible).map(toProject)
}

/** README of a single repo, rendered to HTML by GitHub. Null when unavailable. */
export async function loadReadme(repo: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`${API}/repos/${config.username}/${repo}/readme`, {
      signal,
      headers: { Accept: 'application/vnd.github.html+json' },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export function sortProjects(projects: Project[], key: SortKey): Project[] {
  const order = [...projects]
  switch (key) {
    case 'featured':
      return order.sort((a, b) => {
        const ia = config.featured.indexOf(a.name)
        const ib = config.featured.indexOf(b.name)
        if (ia !== -1 && ib !== -1) return ia - ib
        if (ia !== -1) return -1
        if (ib !== -1) return 1
        return b.stargazers_count - a.stargazers_count
      })
    case 'stars':
      return order.sort((a, b) => b.stargazers_count - a.stargazers_count)
    case 'updated':
      return order.sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    case 'name':
      return order.sort((a, b) => a.title.localeCompare(b.title))
  }
}

/** Case-insensitive match across name, description, topics, language and category. */
export function searchProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase()
  if (!q) return projects
  return projects.filter((p) =>
    [p.title, p.name, p.description ?? '', p.language ?? '', p.category, ...p.topics]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}
