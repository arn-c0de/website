import assert from 'node:assert/strict'
import test from 'node:test'
import { youtubeEmbedUrl, youtubeId, youtubeStart, youtubeWatchUrl } from '../lib/video.ts'

test('every common form of YouTube link gives the same id', () => {
  const id = 'dQw4w9WgXcQ'
  for (const link of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&list=PL123`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
  ]) {
    assert.equal(youtubeId(link), id, link)
  }
})

test('anything else is rejected rather than embedded', () => {
  for (const link of ['', 'not a link', 'https://vimeo.com/123456', 'https://youtube.com/watch?v=short', 'https://evil.example/watch?v=dQw4w9WgXcQ']) {
    assert.equal(youtubeId(link), null, link)
  }
})

test('a start time in the link carries over', () => {
  assert.equal(youtubeStart('https://youtu.be/dQw4w9WgXcQ?t=90'), 90)
  assert.equal(youtubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s'), 90)
  assert.equal(youtubeStart('dQw4w9WgXcQ'), 0)
  assert.match(youtubeEmbedUrl('dQw4w9WgXcQ', 90), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*start=90/)
  assert.equal(youtubeWatchUrl('dQw4w9WgXcQ', 90), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s')
})
