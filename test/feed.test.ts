import assert from 'node:assert/strict'
import test from 'node:test'
import type { TimelineEntry } from '../timeline.config.ts'
import { buildAtomFeed, escapeXml, feedDate, feedEntries } from '../lib/feed.ts'

const entry = (id: string, status: TimelineEntry['status'], date?: string): TimelineEntry => ({
  id,
  status,
  date,
  title: { en: `Title ${id}`, de: `Titel ${id}` },
  text: 'Body',
})

test('only dated entries that are done or in progress make the feed, newest first', () => {
  const ids = feedEntries([
    entry('a', 'done', '2026-01'),
    entry('b', 'planned', '2027-01'),
    entry('c', 'now', '2026-05-02'),
    entry('d', 'done'),
  ]).map((e) => e.id)
  assert.deepEqual(ids, ['c', 'a'])
})

test('month-only dates become the first of the month in UTC', () => {
  assert.equal(feedDate('2026-07'), '2026-07-01T00:00:00Z')
  assert.equal(feedDate('2026-07-18'), '2026-07-18T00:00:00Z')
})

test('the feed is dated by its newest entry, not the build', () => {
  const xml = buildAtomFeed([entry('a', 'done', '2026-01'), entry('c', 'now', '2026-05-02')], 'en', 'https://x.test')
  assert.match(xml, /<feed[^>]*>[\s\S]*?<updated>2026-05-02T00:00:00Z<\/updated>/)
  assert.match(xml, /<id>https:\/\/x\.test\/\?tab=timeline#tl-c<\/id>/)
})

test('entries link to their own post page', () => {
  const xml = buildAtomFeed([entry('c', 'now', '2026-05-02')], 'en', 'https://x.test')
  assert.match(xml, /<link rel="alternate" type="text\/html" href="https:\/\/x\.test\/timeline\/c\/"\/>/)
})

test('text is escaped and the language is picked', () => {
  const e = { ...entry('a', 'done', '2026-01'), title: { en: 'A <b> & "c"', de: 'Deutsch' } }
  assert.match(buildAtomFeed([e], 'en', 'https://x.test'), /A &lt;b&gt; &amp; &quot;c&quot;/)
  assert.match(buildAtomFeed([e], 'de', 'https://x.test'), /<title>Deutsch<\/title>/)
  assert.equal(escapeXml(`'`), '&apos;')
})
