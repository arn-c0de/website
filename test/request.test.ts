import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INQUIRY_EMAIL,
  INQUIRY_TYPES,
  MAILTO_LIMIT,
  SERVICE_AREAS,
  TIMELINES,
  areaTitles,
  buildBody,
  buildMailto,
  buildSubject,
  looksLikeEmail,
  typeOf,
  type RequestDraft,
} from '../lib/request.ts'
import type { Project } from '../lib/types.ts'

function project(name: string): Project {
  return {
    name,
    full_name: `arn-c0de/${name}`,
    description: null,
    html_url: `https://github.com/arn-c0de/${name}`,
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
    title: name,
    category: 'Tools',
    featured: false,
    links: [],
    icon: null,
  }
}

function draft(partial: Partial<RequestDraft> = {}): RequestDraft {
  return {
    name: 'Alex',
    email: 'alex@example.com',
    type: 'build',
    areas: [],
    timeline: TIMELINES[0],
    message: 'Hello',
    projects: [],
    ...partial,
  }
}

test('the catalogue has no duplicate ids', () => {
  const ids = SERVICE_AREAS.map((a) => a.id)
  assert.equal(new Set(ids).size, ids.length)

  const types = INQUIRY_TYPES.map((t) => t.id)
  assert.equal(new Set(types).size, types.length)
})

test('every area carries a title and something to search on', () => {
  for (const area of SERVICE_AREAS) {
    assert.ok(area.title.trim().length > 0, area.id)
    assert.ok(area.keywords.trim().length > 0, area.id)
  }
})

test('an unknown type falls back rather than throwing', () => {
  assert.equal(typeOf('question').label, 'Question about a project')
  // @ts-expect-error — deliberately not one of the ids.
  assert.equal(typeOf('nonsense'), INQUIRY_TYPES[0])
})

test('area titles come back in catalogue order, not selection order', () => {
  const [first, second] = SERVICE_AREAS
  assert.deepEqual(areaTitles([second.id, first.id]), [first.title, second.title])
})

test('the subject names one focus, and counts the rest', () => {
  const type = typeOf('build').label

  assert.equal(buildSubject(draft()), type)
  assert.equal(buildSubject(draft({ projects: [project('Crawllama')] })), `${type} — Crawllama`)
  assert.equal(
    buildSubject(draft({ projects: [project('Crawllama'), project('Hashkrieg')] })),
    `${type} — Crawllama +1 more`,
  )
})

test('projects win over areas in the subject, and "not sure" is not a focus', () => {
  const areas = draft({ areas: ['unsure', 'llm'] })
  assert.equal(buildSubject(areas), `${typeOf('build').label} — Local LLMs & RAG`)

  const both = draft({ areas: ['llm'], projects: [project('Crawllama')] })
  assert.equal(buildSubject(both), `${typeOf('build').label} — Crawllama`)

  assert.equal(buildSubject(draft({ areas: ['unsure'] })), typeOf('build').label)
})

test('the body carries the message, the picks and the contact details', () => {
  const body = buildBody(
    draft({ areas: ['llm', 'databases'], projects: [project('Crawllama')], message: '  Need help  ' }),
  )

  assert.match(body, /^Hello arn-c0de,/)
  assert.match(body, /Need help/)
  assert.doesNotMatch(body, / {2}Need help/)
  assert.match(body, /Areas: {5}Local LLMs & RAG/)
  assert.match(body, /\n {11}Databases & storage/)
  assert.match(body, /Projects: {2}Crawllama — https:\/\/github\.com\/arn-c0de\/Crawllama/)
  assert.match(body, /Timeline: {2}No fixed date/)
  assert.match(body, /Name: {6}Alex/)
  assert.match(body, /Email: {5}alex@example\.com/)
})

test('an empty draft still produces a readable mail', () => {
  const body = buildBody(draft({ message: '   ', name: ' ', email: '' }))
  assert.match(body, /\(no message\)/)
  assert.match(body, /Name: {6}\(not given\)/)
  assert.match(body, /Email: {5}\(not given\)/)
  // Nothing was picked, so neither block is printed at all.
  assert.doesNotMatch(body, /Areas:|Projects:/)
})

test('the mailto goes to the inquiry address and encodes spaces properly', () => {
  const url = buildMailto(draft({ message: 'two words' }))
  assert.ok(url.startsWith(`mailto:${INQUIRY_EMAIL}?`))
  // URLSearchParams writes "+" for a space, which mail clients show literally.
  assert.doesNotMatch(url, /\+/)
  assert.match(url, /two%20words/)
})

test('the mailto limit leaves room for a real message', () => {
  const body = buildBody(draft({ message: 'x'.repeat(200) }))
  assert.ok(body.length < MAILTO_LIMIT)
})

test('email check accepts the ordinary and rejects the obvious', () => {
  for (const ok of ['a@b.de', 'first.last+tag@sub.example.com', ' padded@example.org ']) {
    assert.ok(looksLikeEmail(ok), ok)
  }
  for (const bad of ['', 'nope', 'a@b', 'a@b.c', 'two words@example.com', 'a@@b.com']) {
    assert.ok(!looksLikeEmail(bad), bad)
  }
})
