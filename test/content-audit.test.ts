import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import config, { type SiteConfig } from '../projects.config.ts'
import timeline, { type TimelineEntry } from '../timeline.config.ts'
import repos from '../data/repos.json'
import icons from '../data/repo-icons.json'
import { now } from '../now.config.ts'
import { PRIVATE_PROJECTS } from '../lib/privateProjects.ts'
import { auditContent, entryIsAbout, type AuditInput } from '../lib/contentAudit.ts'
import type { GitHubRepo } from '../lib/types.ts'

const NOW = new Date('2026-10-12T12:00:00Z')

const repo = (name: string, extra: Partial<GitHubRepo> = {}): GitHubRepo => ({
  name, full_name: `me/${name}`, html_url: '', homepage: null, language: 'C',
  description: 'A description that is long enough to read as a real one on a card.',
  stargazers_count: 0, forks_count: 0, topics: ['esp32'], fork: false, archived: false,
  pushed_at: '2026-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z', license: null,
  ...extra,
})

const entry = (id: string, extra: Partial<TimelineEntry> = {}): TimelineEntry => ({
  id, status: 'done', date: '2026-01', title: id, text: id, ...extra,
})

const siteConfig = (extra: Partial<SiteConfig> = {}): SiteConfig => ({
  username: 'me', featured: [], hidden: [], showForks: false, showArchived: false,
  showAllByDefault: true, overrides: {}, categories: [], fallbackCategory: 'Tools', ...extra,
})

function audit(extra: Partial<AuditInput>) {
  return auditContent({
    repos: [], config: siteConfig(), privateNames: [], timeline: [], icons: [],
    publicFileExists: () => true, now: NOW, ...extra,
  })
}
const kinds = (findings: ReturnType<typeof audit>) => findings.map((f) => `${f.kind}:${f.subject}`)

test('the committed content has no audit errors', () => {
  const findings = auditContent({
    repos, config, privateNames: PRIVATE_PROJECTS.map((p) => p.name), timeline, icons, nowReviewed: now.reviewed,
    publicFileExists: (path) => existsSync(new URL(`../public${path}`, import.meta.url)),
    now: NOW,
  })
  assert.deepEqual(findings.filter((f) => f.level === 'error'), [])
})

test('references to nothing are errors', () => {
  const findings = audit({
    repos: [repo('Real')],
    config: siteConfig({ featured: ['Real', 'Gone'] }),
    privateNames: ['Secret'],
    timeline: [
      entry('a', { project: 'Secret', mentions: ['Typo'] }),
      entry('b', { project: 'Nope', images: [{ src: '/timeline/missing.webp', alt: 'x' }] }),
    ],
    publicFileExists: (p) => p !== '/timeline/missing.webp',
  })
  const errors = kinds(findings.filter((f) => f.level === 'error'))
  assert.deepEqual(errors.sort(), ['missing-media:b', 'unknown-featured:Gone', 'unknown-project:a', 'unknown-project:b'])
})

test('planned entries whose period has passed and old "now" entries are reported', () => {
  const findings = audit({
    timeline: [
      entry('past', { status: 'planned', date: '2026-09' }),
      entry('this-month', { status: 'planned', date: '2026-10' }),
      entry('old-now', { status: 'now', date: '2026-08-01' }),
      entry('fresh-now', { status: 'now', date: '2026-10-01' }),
      entry('future-done', { status: 'done', date: '2026-12' }),
    ],
  })
  assert.deepEqual(kinds(findings), ['done-in-future:future-done', 'now-stale:old-now', 'planned-overdue:past'])
})

test('pushes long after the newest entry are reported until reviewed', () => {
  const repos = [repo('Busy', { pushed_at: '2026-09-20T00:00:00Z' }), repo('Quiet')]
  const timeline = [entry('busy', { project: 'Busy', date: '2026-05' }), entry('quiet', { mentions: ['Quiet'] })]
  const before = audit({ repos, timeline, icons: ['busy', 'quiet'] })
  assert.deepEqual(kinds(before), ['activity-not-posted:Busy'])

  const after = audit({
    repos, timeline, icons: ['busy', 'quiet'],
    config: siteConfig({ overrides: { Busy: { reviewed: '2026-09-25' } } }),
  })
  assert.deepEqual(after, [])
})

test('hidden repos and forks are not audited; thin text and missing parts are', () => {
  const findings = audit({
    repos: [
      repo('Hidden', { description: null }),
      repo('Fork', { fork: true, description: null }),
      repo('Thin', { description: 'Tooling.', topics: [] }),
    ],
    config: siteConfig({ hidden: ['Hidden'] }),
  })
  assert.deepEqual(kinds(findings), ['no-topics:Thin', 'thin-description:Thin', 'no-icon:Thin', 'no-timeline:Thin'])
})

test('an entry is about a project by project, mentions, or the name in its id', () => {
  assert.ok(entryIsAbout(entry('x', { project: 'A-Repo' }), 'A-Repo', 'A-Repo'))
  assert.ok(entryIsAbout(entry('x', { project: 'Other', mentions: ['A-Repo'] }), 'A-Repo', 'A-Repo'))
  assert.ok(entryIsAbout(entry('zombieescape'), 'ZombieEscape-Preview', 'ZombieEscape'))
  assert.ok(!entryIsAbout(entry('zombieescape', { project: 'Other' }), 'ZombieEscape-Preview', 'ZombieEscape'))
})

test('the "Currently building" list asks for a check after 60 days', () => {
  assert.deepEqual(audit({ nowReviewed: '2026-09-01' }), [])
  assert.deepEqual(kinds(audit({ nowReviewed: '2026-07-01' })), ['now-list-stale:now.config.ts'])
  assert.deepEqual(kinds(audit({ nowReviewed: '1.7.2026' })), ['bad-reviewed:now.config.ts'])
})

test('every item of the "Currently building" list is complete in both languages', () => {
  for (const item of now.items) {
    for (const value of [item.name, item.about]) {
      if (value === undefined || typeof value === 'string') continue
      assert.ok(value.en.trim() && value.de.trim(), JSON.stringify(item.name))
    }
    assert.ok(item.about || item.overview, `${JSON.stringify(item.name)} is shown nowhere`)
  }
})
