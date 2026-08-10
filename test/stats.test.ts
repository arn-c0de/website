import assert from 'node:assert/strict'
import test from 'node:test'
import {
  activityDomain,
  formatSpan,
  languageShare,
  monthlyActivity,
  projectSpans,
} from '../lib/stats.ts'
import type { Project } from '../lib/types.ts'

/** A repository reduced to what the aggregations read. */
function project(name: string, language: string | null, created: string, pushed: string): Project {
  return {
    name,
    full_name: `arn-c0de/${name}`,
    description: null,
    html_url: '',
    homepage: null,
    language,
    stargazers_count: 0,
    forks_count: 0,
    topics: [],
    fork: false,
    archived: false,
    created_at: created,
    pushed_at: pushed,
    license: null,
    title: name,
    category: 'Tools',
    featured: false,
    links: [],
    icon: null,
  }
}

const UTC = (iso: string) => Date.parse(iso)

test('language share counts, sorts and normalises', () => {
  const share = languageShare([
    project('a', 'Python', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
    project('b', 'Python', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
    project('c', 'C', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
    // No language: counted by nobody, including the total.
    project('d', null, '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
  ])

  assert.deepEqual(share.map((s) => s.name), ['Python', 'C'])
  assert.deepEqual(share.map((s) => s.count), [2, 1])
  assert.equal(share.reduce((sum, s) => sum + s.share, 0), 1)
})

test('language share of nothing is nothing, not a division by zero', () => {
  assert.deepEqual(languageShare([]), [])
  assert.deepEqual(languageShare([project('a', null, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z')]), [])
})

test('months are bucketed in UTC and carry over the year', () => {
  const months = monthlyActivity([
    project('old', 'C', '2025-11-20T23:30:00Z', '2026-01-05T00:00:00Z'),
  ])

  assert.deepEqual(months.map((m) => `${m.label} ${m.year}`), ['Nov 25', 'Dec 25', 'Jan 26'])
  assert.deepEqual(months.map((m) => m.started), [1, 0, 0])
  assert.deepEqual(months.map((m) => m.active), [1, 1, 1])
  assert.equal(months[0].at, Date.UTC(2025, 10, 1))
})

test('a project counts as active only between its own two dates', () => {
  const months = monthlyActivity([
    project('early', 'C', '2026-01-10T00:00:00Z', '2026-02-10T00:00:00Z'),
    project('late', 'C', '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z'),
  ])

  assert.deepEqual(months.map((m) => m.label), ['Jan', 'Feb', 'Mar', 'Apr'])
  assert.deepEqual(months.map((m) => m.started), [1, 0, 1, 0])
  assert.deepEqual(months.map((m) => m.active), [1, 1, 1, 1])
})

test('a far-past date cannot grow the axis without limit', () => {
  const months = monthlyActivity([
    project('ancient', 'C', '1998-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ])
  assert.equal(months.length, 72)
})

test('no repositories means no months and a usable domain', () => {
  assert.deepEqual(monthlyActivity([]), [])
  assert.deepEqual(activityDomain([]), [0, 1])
})

test('the domain ends after the last month, not on it', () => {
  const months = monthlyActivity([project('a', 'C', '2026-11-01T00:00:00Z', '2026-12-20T00:00:00Z')])
  assert.deepEqual(activityDomain(months), [Date.UTC(2026, 10, 1), Date.UTC(2027, 0, 1)])
})

test('spans are ordered oldest first and never run backwards', () => {
  const spans = projectSpans([
    project('second', 'C', '2026-02-01T00:00:00Z', '2026-03-01T00:00:00Z'),
    project('first', 'C', '2026-01-01T00:00:00Z', '2026-04-01T00:00:00Z'),
    // A push older than the creation date — GitHub does produce these.
    project('backwards', 'C', '2026-05-01T00:00:00Z', '2026-04-01T00:00:00Z'),
  ])

  assert.deepEqual(spans.map((s) => s.name), ['first', 'second', 'backwards'])
  for (const span of spans) assert.ok(span.to >= span.from, span.name)
  assert.equal(spans[2].to, UTC('2026-05-01T00:00:00Z'))
})

test('spans drop repositories with unusable dates', () => {
  const spans = projectSpans([
    project('fine', 'C', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
    project('empty', 'C', '', ''),
    project('garbage', 'C', 'not a date', 'not a date'),
  ])
  assert.deepEqual(spans.map((s) => s.name), ['fine'])
})

test('the same language always gets the same hue', () => {
  const [a] = projectSpans([project('a', 'Kotlin', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')])
  const [b] = projectSpans([project('b', 'Kotlin', '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z')])
  assert.equal(a.hue, b.hue)
})

test('span lengths read as months and years', () => {
  const month = 2_629_800_000
  assert.equal(formatSpan(0, 0), '1 month')
  assert.equal(formatSpan(0, 2 * month), '2 months')
  assert.equal(formatSpan(0, 12 * month), '1 year')
  assert.equal(formatSpan(0, 14 * month), '1 year 2 months')
  assert.equal(formatSpan(0, 25 * month), '2 years 1 month')
})
