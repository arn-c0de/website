import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import timeline, { type Localized } from '../timeline.config.ts'
import { youtubeId } from '../lib/video.ts'

const STATUSES = ['planned', 'now', 'done']
const LAYOUTS = ['text', 'image-left', 'image-right', 'images-sides', 'image-center', 'gallery']

function bothLanguages(value: Localized | undefined, where: string) {
  if (value === undefined || typeof value === 'string') return
  assert.ok(value.en?.trim(), `${where}: English text missing`)
  assert.ok(value.de?.trim(), `${where}: German text missing`)
}

test('timeline entries have unique ids and known statuses and layouts', () => {
  const ids = timeline.map((e) => e.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate id')
  for (const e of timeline) {
    assert.ok(/^[a-z0-9-]+$/.test(e.id), `${e.id}: id should be lowercase-with-dashes`)
    assert.ok(STATUSES.includes(e.status), `${e.id}: unknown status ${e.status}`)
    if (e.layout) assert.ok(LAYOUTS.includes(e.layout), `${e.id}: unknown layout ${e.layout}`)
  }
})

test('timeline dates are YYYY-MM or YYYY-MM-DD, and past entries have one', () => {
  for (const e of timeline) {
    if (e.date) assert.match(e.date, /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, e.id)
    if (e.status !== 'planned') assert.ok(e.date || e.when, `${e.id}: needs a date or "when"`)
  }
})

test('every timeline text is complete in both languages', () => {
  for (const e of timeline) {
    for (const key of ['title', 'text', 'aside', 'when'] as const) bothLanguages(e[key], `${e.id}.${key}`)
    if (e.help) {
      assert.ok(e.help.areas.length > 0, `${e.id}: help needs at least one area`)
      e.help.areas.forEach((area, i) => bothLanguages(area, `${e.id}.help.areas[${i}]`))
      assert.match(e.help.href, /^https:\/\//, `${e.id}: help link should be https`)
    }
    ;[...(e.media ?? []), ...(e.images ?? [])].forEach((item, i) => {
      if ('alt' in item) bothLanguages(item.alt, `${e.id}.media[${i}].alt`)
      if ('title' in item) bothLanguages(item.title, `${e.id}.media[${i}].title`)
      bothLanguages(item.caption, `${e.id}.media[${i}].caption`)
    })
  }
})

test('timeline pictures and videos exist and layouts get what they need', () => {
  const exists = (path: string) => existsSync(new URL(`../public${path}`, import.meta.url))
  for (const e of timeline) {
    const media = [...(e.media ?? []), ...(e.images ?? [])]
    for (const item of media) {
      const files =
        'src' in item ? [item.src] : 'video' in item ? [item.video, item.poster] : [item.poster]
      for (const file of files) {
        if (!file) continue
        assert.ok(file.startsWith('/'), `${e.id}: path should start with / (${file})`)
        assert.ok(exists(file), `${e.id}: missing public${file}`)
      }
      if ('youtube' in item) assert.ok(youtubeId(item.youtube), `${e.id}: not a YouTube link: ${item.youtube}`)
      if ('video' in item) assert.match(item.video, /\.(mp4|webm)$/, `${e.id}: use MP4 or WebM`)
    }
    if (e.layout && e.layout !== 'text') assert.ok(media.length > 0, `${e.id}: layout ${e.layout} needs a picture or video`)
    if (e.layout === 'images-sides') assert.equal(media.length, 2, `${e.id}: images-sides takes two items`)
    if (e.layout === 'image-center') assert.ok(e.aside, `${e.id}: image-center needs an aside text`)
  }
})
