/** Shape of a repository as returned by the GitHub REST API (only what we use). */
export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  fork: boolean
  archived: boolean
  pushed_at: string
  created_at: string
  license: string | null
}

/** A repo after config overrides have been applied. This is what the UI renders. */
export interface Project extends GitHubRepo {
  /** Display title — override or repo name. */
  title: string
  /** Curated category, derived from config or inferred from topics/language. */
  category: string
  /** True when listed in `featured` — gets a larger card and shows up first. */
  featured: boolean
  /** Extra links beyond the repo itself. */
  links: { label: string; href: string }[]
  /**
   * Path to the project's own icon, or null when it has none. Filled in from
   * `data/repo-icons.json`, which `scripts/generate-repo-icons.mjs` writes.
   */
  icon: string | null
  /** Public delivery state or a private research/access project. */
  status: 'active' | 'research' | 'private' | 'preview' | 'archived'
  isPrivate: boolean
}

export type SortKey = 'featured' | 'stars' | 'updated' | 'name'

/** Where the currently displayed data came from — surfaced in the UI footer. */
export type DataSource = 'live' | 'snapshot'
