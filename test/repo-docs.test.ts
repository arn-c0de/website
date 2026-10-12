import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareReadme } from '../lib/readmeHtml.ts'
import { docDir, docKind, pickDocs, trimDoc } from '../lib/repoDocs.ts'

test('recognises roadmap, milestones, features and changelog by file name', () => {
  assert.equal(docKind('docs/ROADMAP.md'), 'roadmap')
  assert.equal(docKind('docs/production/Milestones.md'), 'milestones')
  assert.equal(docKind('docs/FEATURES.md'), 'features')
  assert.equal(docKind('CHANGELOG.md'), 'changelog')
  assert.equal(docKind('HISTORY.md'), 'changelog')
  assert.equal(docKind('planv2.md'), 'doc')
})

test('picks one file per kind, nearest the root, in page order', () => {
  const picks = pickDocs([
    'README.md',
    'CHANGELOG.md',
    'Simple-Sim/CHANGELOG.md',
    'docs/ROADMAP.md',
    'docs/EN/planning/roadmap.md',
    '.github/ROADMAP.md',
    'node_modules/x/CHANGELOG.md',
    'docs/production/Milestones.md',
    'src/main.rs',
  ])
  assert.deepEqual(picks, [
    { kind: 'roadmap', path: 'docs/ROADMAP.md' },
    { kind: 'milestones', path: 'docs/production/Milestones.md' },
    { kind: 'changelog', path: 'CHANGELOG.md' },
  ])
})

test('listed paths win over found ones; false shows none', () => {
  assert.deepEqual(pickDocs(['ROADMAP.md', 'CHANGELOG.md'], ['docs/EN/planning/roadmap.md', 'PLANS.md']), [
    { kind: 'roadmap', path: 'docs/EN/planning/roadmap.md' },
    { kind: 'changelog', path: 'CHANGELOG.md' },
    { kind: 'doc', path: 'PLANS.md' },
  ])
  assert.deepEqual(pickDocs(['ROADMAP.md'], false), [])
})

test('long files are cut at a heading', () => {
  const html = `<h2>1.2</h2><p>${'a'.repeat(50)}</p><h2>1.1</h2><p>${'b'.repeat(50)}</p>`
  assert.deepEqual(trimDoc(html, 1000), { html, truncated: false })
  const cut = trimDoc(html, 80)
  assert.equal(cut.truncated, true)
  assert.equal(cut.html, `<h2>1.2</h2><p>${'a'.repeat(50)}</p>`)
})

test('links in a file below the root resolve from its folder', () => {
  assert.equal(docDir('docs/ROADMAP.md'), 'docs/')
  assert.equal(docDir('CHANGELOG.md'), '')
  const { html } = prepareReadme('<a href="FEATURES.md">f</a><img src="img/a.png">', 'arn-c0de', 'Demo', 'docs/')
  assert.match(html, /href="https:\/\/github\.com\/arn-c0de\/Demo\/blob\/HEAD\/docs\/FEATURES\.md"/)
  assert.match(html, /data-src="https:\/\/raw\.githubusercontent\.com\/arn-c0de\/Demo\/HEAD\/docs\/img\/a\.png"/)
})
