import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { DE, LONG } from '../lib/i18n-de.ts'

/** Every literal handed to t() or tr() in a component, with where it came from. */
function literalKeys() {
  const keys = new Map<string, string>()
  const dir = new URL('../components/', import.meta.url)
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, dir), 'utf8')
    for (const match of source.matchAll(/\btr?\(\s*(['"])((?:(?!\1).)+)\1/g)) {
      keys.set(match[2], file)
    }
  }
  return keys
}

test('every string the components translate has a German entry', () => {
  const missing = [...literalKeys()]
    .filter(([key]) => !(key in DE) && !(key in LONG))
    .map(([key, file]) => `${file}: ${key}`)
  assert.deepEqual(missing, [])
})

test('long passages carry both languages', () => {
  for (const [key, entry] of Object.entries(LONG)) {
    assert.ok(entry.en.trim(), `${key} has no English text`)
    assert.ok(entry.de.trim(), `${key} has no German text`)
  }
})

test('German entries keep the placeholders of their English key', () => {
  const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join()
  for (const [en, de] of Object.entries(DE)) {
    assert.equal(placeholders(de), placeholders(en), en)
  }
})
