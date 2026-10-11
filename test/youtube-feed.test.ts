import assert from 'node:assert/strict'
import test from 'node:test'
import { channelIdFromPage, decodeXml, parseFeed, summarize } from '../lib/youtube-feed.ts'
import { guessProject, videoEntries } from '../lib/videos.ts'

// Shaped like https://www.youtube.com/feeds/videos.xml?channel_id=… returns it.
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>arn-c0de</title>
 <entry>
  <id>yt:video:AAAAAAAAAAA</id>
  <yt:videoId>AAAAAAAAAAA</yt:videoId>
  <title>QLink running on Quest 3 &amp; desktop</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=AAAAAAAAAAA"/>
  <published>2026-10-05T18:00:00+00:00</published>
  <media:group>
   <media:title>QLink running on Quest 3 &amp; desktop</media:title>
   <media:description>First look at QLink: the simulation runs as the Link home on Quest 3. The same world runs in 2D on the desktop. More soon!

00:00 Intro
01:30 Desktop view
🔗 https://github.com/arn-c0de/QLink-preview
Subscribe for updates
#rust #vr #linux</media:description>
  </media:group>
 </entry>
 <entry>
  <yt:videoId>BBBBBBBBBBB</yt:videoId>
  <title>ESP32 flashing in 30 seconds</title>
  <link rel="alternate" href="https://www.youtube.com/shorts/BBBBBBBBBBB"/>
  <published>2026-09-20T10:00:00+00:00</published>
  <media:group><media:description>#esp32 #shorts</media:description></media:group>
 </entry>
</feed>`

test('the feed gives id, title, date, description and whether it is a Short', () => {
  const videos = parseFeed(FEED)
  assert.equal(videos.length, 2)
  assert.deepEqual(
    { ...videos[0], description: videos[0].description.slice(0, 25) },
    {
      id: 'AAAAAAAAAAA',
      title: 'QLink running on Quest 3 & desktop',
      published: '2026-10-05T18:00:00+00:00',
      description: 'First look at QLink: the ',
      short: false,
    },
  )
  assert.equal(videos[1].short, true)
})

test('a description becomes two plain sentences without links, chapters or hashtags', () => {
  const [video] = parseFeed(FEED)
  assert.equal(
    summarize(video.description),
    'First look at QLink: the simulation runs as the Link home on Quest 3. The same world runs in 2D on the desktop.',
  )
  assert.equal(summarize('#esp32 #shorts'), '')
  assert.equal(summarize('Abonniert den Kanal!\nhttps://x.com/me'), '')
})

test('a very long first sentence is cut at a word, not mid-word', () => {
  const long = `${'word '.repeat(80)}end.`
  const s = summarize(long, 60)
  assert.ok(s.length <= 61, s)
  assert.ok(s.endsWith('word…'), s)
})

test('entities and CDATA are decoded', () => {
  assert.equal(decodeXml('Tom &amp; Jerry &#39;n&#x27; &lt;3'), "Tom & Jerry 'n' <3")
  assert.equal(decodeXml('<![CDATA[a < b]]>'), 'a < b')
})

test('the channel id is found on the channel page', () => {
  const id = 'UC' + 'x'.repeat(22)
  assert.equal(channelIdFromPage(`<link rel="alternate" href="https://www.youtube.com/feeds/videos.xml?channel_id=${id}">`), id)
  assert.equal(channelIdFromPage(`{"externalId":"${id}"}`), id)
  assert.equal(channelIdFromPage('<html>nothing</html>'), null)
})

const PROJECTS = [
  { name: 'QLink-preview', title: 'QLink' },
  { name: 'ESP32-LABs', title: 'ESP32-LABs' },
  { name: 'ESP32-LoRa-Mesh-Server', title: 'ESP32-LoRa-Mesh-Server' },
]

test('a video is linked to the project its title names', () => {
  assert.equal(guessProject({ title: 'QLink running on Quest 3', summary: '' }, PROJECTS), 'QLink-preview')
  assert.equal(guessProject({ title: 'Mesh demo', summary: 'Using the ESP32-LoRa-Mesh-Server firmware.' }, PROJECTS), 'ESP32-LoRa-Mesh-Server')
  assert.equal(guessProject({ title: 'Unrelated', summary: 'Nothing here.' }, PROJECTS), undefined)
  // Part of a longer word is not a match.
  assert.equal(guessProject({ title: 'QLinkage', summary: '' }, PROJECTS), undefined)
})

test('videos become timeline entries, honouring hidden, overrides, Shorts and manual placement', () => {
  const stored = [
    { id: 'AAAAAAAAAAA', title: 'QLink demo', date: '2026-10-05', summary: 'First look.', poster: '/timeline/youtube/AAAAAAAAAAA.jpg', short: false },
    { id: 'BBBBBBBBBBB', title: 'Short', date: '2026-09-20', summary: '', poster: null, short: true },
    { id: 'CCCCCCCCCCC', title: 'Hidden one', date: '2026-09-01', summary: '', poster: null, short: false },
    { id: 'DDDDDDDDDDD', title: 'Placed by hand', date: '2026-08-01', summary: '', poster: null, short: false },
  ]
  const settings = {
    handle: '@x',
    max: 10,
    includeShorts: false,
    hidden: ['CCCCCCCCCCC'],
    overrides: { AAAAAAAAAAA: { text: { en: 'Custom', de: 'Eigen' } } },
  }
  const manual = [{ id: 'm', status: 'done' as const, title: 'm', text: 'm', media: [{ youtube: 'https://youtu.be/DDDDDDDDDDD', title: 'x' }] }]

  const entries = videoEntries(stored, settings, PROJECTS, manual)
  assert.deepEqual(entries.map((e) => e.id), ['yt-aaaaaaaaaaa'])
  const [e] = entries
  assert.equal(e.status, 'done')
  assert.equal(e.date, '2026-10-05')
  assert.deepEqual(e.text, { en: 'Custom', de: 'Eigen' })
  assert.equal(e.project, 'QLink-preview')
  assert.deepEqual(e.media, [{ youtube: 'AAAAAAAAAAA', title: 'QLink demo', poster: '/timeline/youtube/AAAAAAAAAAA.jpg' }])
})
