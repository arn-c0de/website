import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageProjects, projectSlug, relatedProjects } from '../lib/projectPages.ts'

test('every public project gets a unique, URL-safe slug', () => {
  const projects = pageProjects()
  assert.ok(projects.length > 0)
  const slugs = projects.map(projectSlug)
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/)
  assert.equal(new Set(slugs).size, slugs.length, 'two projects share a slug')
})

test('private projects have no page', () => {
  assert.ok(pageProjects().every((p) => !p.isPrivate))
})

test('slugs follow the display title', () => {
  assert.equal(projectSlug({ title: 'QLink' }), 'qlink')
  assert.equal(projectSlug({ title: 'AD8232-EMG' }), 'ad8232-emg')
  assert.equal(projectSlug({ title: '  ESP32 Labs! ' }), 'esp32-labs')
})

test('related projects share the category and exclude the project itself', () => {
  const projects = pageProjects()
  for (const p of projects) {
    for (const r of relatedProjects(p, projects)) {
      assert.notEqual(r.name, p.name)
      assert.equal(r.category, p.category)
    }
  }
})
