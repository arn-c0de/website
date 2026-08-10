import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMonth, formatRelative, languageHue } from '../lib/format.ts'

const DAY = 86_400_000

test('a missing timestamp renders as a dash, not as "Invalid Date"', () => {
  assert.equal(formatMonth(''), '—')
  assert.equal(formatRelative(''), '—')
})

test('month precision, in English regardless of the machine', () => {
  assert.equal(formatMonth('2026-08-09T20:04:02Z'), 'Aug 2026')
})

test('relative time is coarse and singular where it should be', () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

  assert.equal(formatRelative(ago(0)), 'today')
  assert.equal(formatRelative(ago(1.5 * DAY)), '1 day ago')
  assert.equal(formatRelative(ago(3 * DAY)), '3 days ago')
  assert.equal(formatRelative(ago(45 * DAY)), '1 month ago')
  assert.equal(formatRelative(ago(200 * DAY)), '6 months ago')
  assert.equal(formatRelative(ago(400 * DAY)), '1 year ago')
})

test('a language always gets the same hue, inside the colour wheel', () => {
  for (const language of ['Python', 'Kotlin', 'C', 'C#', 'TypeScript', '']) {
    const hue = languageHue(language)
    assert.equal(hue, languageHue(language), language)
    assert.ok(hue >= 0 && hue < 360, `${language}: ${hue}`)
  }
})

test('no language still has a colour', () => {
  assert.equal(languageHue(null), 220)
})

test('two languages that differ get different hues', () => {
  // Not guaranteed by the hash in general, but these are the ones on the site.
  const hues = ['Python', 'Kotlin', 'C', 'C#', 'C++', 'Java', 'Shell', 'JavaScript'].map(languageHue)
  assert.equal(new Set(hues).size, hues.length)
})
