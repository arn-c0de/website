import { test } from 'node:test'
import assert from 'node:assert/strict'
import { commitSummary, weeksSince } from '../lib/commits.ts'

const weeks = [
  { week: '2026-08-30', commits: 4 },
  { week: '2026-09-06', commits: 10 },
  { week: '2026-09-13', commits: 0 },
  { week: '2026-09-20', commits: 7 },
]

test('weeks are cut at the start of the range', () => {
  assert.deepEqual(
    weeksSince(weeks, Date.parse('2026-09-01')).map((w) => w.week),
    ['2026-09-06', '2026-09-13', '2026-09-20'],
  )
})

test('summary: total, average per week to one decimal, and peak', () => {
  assert.deepEqual(commitSummary(weeks), { total: 21, perWeek: 5.3, peak: 10 })
  assert.deepEqual(commitSummary([]), { total: 0, perWeek: 0, peak: 0 })
})
