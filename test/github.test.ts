import assert from 'node:assert/strict'
import test from 'node:test'
import config from '../projects.config.ts'
import snapshot from '../data/repos.json' with { type: 'json' }
import { searchProjects, snapshotProjects, sortProjects } from '../lib/github.ts'
import type { GitHubRepo, Project } from '../lib/types.ts'

const repos = snapshot as GitHubRepo[]
const projects = snapshotProjects()

/**
 * The visibility assertions restate the rule rather than naming repositories,
 * so editing `featured`, `hidden` or an override never breaks a test — only
 * changing what the rule *means* does.
 */
test('a repo is visible unless a filter or an override says otherwise', () => {
  const visible = new Set(projects.map((p) => p.name))

  for (const repo of repos) {
    const override = config.overrides[repo.name] ?? {}
    const hidden = config.hidden.includes(repo.name) || override.hidden === true
    const passesFilters =
      (!repo.fork || config.showForks) && (!repo.archived || config.showArchived)

    assert.equal(
      visible.has(repo.name),
      !hidden && (override.show === true || passesFilters),
      repo.name,
    )
  }
})

test('`show` overrides the fork filter but loses to `hidden`', () => {
  const shown = repos.filter((r) => config.overrides[r.name]?.show)
  const names = new Set(projects.map((p) => p.name))

  for (const repo of shown) {
    const hidden = config.hidden.includes(repo.name) || config.overrides[repo.name]?.hidden
    assert.equal(names.has(repo.name), !hidden, repo.name)
  }
})

test('overrides replace the GitHub text', () => {
  for (const [name, override] of Object.entries(config.overrides)) {
    const project = projects.find((p) => p.name === name)
    if (!project) continue

    if (override.title) assert.equal(project.title, override.title)
    if (override.description) assert.equal(project.description, override.description)
    if (override.category) assert.equal(project.category, override.category)
    if (override.topics) assert.deepEqual(project.topics, override.topics)
    assert.equal(project.links.length, override.links?.length ?? 0)
  }
})

test('a project without an override falls back to the repo name and GitHub text', () => {
  const plain = projects.find((p) => !config.overrides[p.name])
  assert.ok(plain, 'expected at least one repo without an override')
  assert.equal(plain.title, plain.name)
  assert.deepEqual(plain.links, [])
})

test('descriptions are collapsed and trimmed', () => {
  // Several GitHub blurbs carry stray double spaces and hard newlines.
  for (const p of projects) {
    if (p.description === null) continue
    assert.doesNotMatch(p.description, /\s\s|\n/, p.name)
    assert.equal(p.description, p.description.trim(), p.name)
  }
})

test('every project lands in a category', () => {
  const known = new Set([...config.categories.map((c) => c.name), config.fallbackCategory])
  for (const p of projects) assert.ok(known.has(p.category), `${p.name}: ${p.category}`)
})

test('category inference takes the first match, and falls back', () => {
  for (const p of projects) {
    if (config.overrides[p.name]?.category) continue

    const signals = [...p.topics, p.language ?? '']
    const first = config.categories.find((c) => c.match.some((m) => signals.includes(m)))
    assert.equal(p.category, first?.name ?? config.fallbackCategory, p.name)
  }
})

test('featured sorting keeps config order, then falls back to stars', () => {
  const sorted = sortProjects(projects, 'featured')
  const featured = config.featured.filter((name) => projects.some((p) => p.name === name))

  assert.deepEqual(sorted.slice(0, featured.length).map((p) => p.name), featured)

  const rest = sorted.slice(featured.length)
  for (let i = 1; i < rest.length; i++) {
    assert.ok(rest[i - 1].stargazers_count >= rest[i].stargazers_count)
  }
})

test('sorting by name, stars and last push', () => {
  const byStars = sortProjects(projects, 'stars')
  for (let i = 1; i < byStars.length; i++) {
    assert.ok(byStars[i - 1].stargazers_count >= byStars[i].stargazers_count)
  }

  const byUpdate = sortProjects(projects, 'updated')
  for (let i = 1; i < byUpdate.length; i++) {
    assert.ok(byUpdate[i - 1].pushed_at >= byUpdate[i].pushed_at)
  }

  const byName = sortProjects(projects, 'name')
  assert.deepEqual(byName.map((p) => p.title), [...byName.map((p) => p.title)].sort((a, b) => a.localeCompare(b)))
})

test('sorting does not mutate the list it was given', () => {
  const before = projects.map((p) => p.name)
  sortProjects(projects, 'stars')
  assert.deepEqual(projects.map((p) => p.name), before)
})

/** Enough of a Project to search; the fields the search does not read stay empty. */
function fake(partial: Partial<Project> & { name: string }): Project {
  return {
    full_name: `arn-c0de/${partial.name}`,
    description: null,
    html_url: '',
    homepage: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    topics: [],
    fork: false,
    archived: false,
    pushed_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    license: null,
    title: partial.name,
    category: 'Tools',
    featured: false,
    links: [],
    icon: null,
    ...partial,
  }
}

test('search reads name, title, description, language, category and topics', () => {
  const list = [
    fake({ name: 'alpha', description: 'A local RAG agent' }),
    fake({ name: 'beta', language: 'Kotlin' }),
    fake({ name: 'gamma', topics: ['esp32', 'lora'] }),
    fake({ name: 'delta', category: 'Embedded' }),
    fake({ name: 'epsilon', title: 'Hashkrieg' }),
  ]

  const found = (q: string) => searchProjects(list, q).map((p) => p.name)

  assert.deepEqual(found('rag'), ['alpha'])
  assert.deepEqual(found('KOTLIN'), ['beta'])
  assert.deepEqual(found('esp32'), ['gamma'])
  assert.deepEqual(found('embedded'), ['delta'])
  assert.deepEqual(found('hashkrieg'), ['epsilon'])
  assert.deepEqual(found('  '), list.map((p) => p.name))
  assert.deepEqual(found('nothing here'), [])
})
