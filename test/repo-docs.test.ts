import { test } from 'node:test'
import assert from 'node:assert/strict'
import { balanceHtml, prepareReadme } from '../lib/readmeHtml.ts'
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

test('long files are cut before a heading and its wrapper, with nothing left open', () => {
  const heading = (v: string) => `<div class="markdown-heading" dir="auto"><h2 class="heading-element">${v}</h2></div>`
  const html = `<div class="md"><article class="markdown-body">${heading('1.2')}<p>${'a'.repeat(50)}</p>${heading('1.1')}<p>${'b'.repeat(50)}</p></article></div>`
  assert.deepEqual(trimDoc(html, 10_000), { html, truncated: false })
  const cut = trimDoc(html, 250)
  assert.equal(cut.truncated, true)
  assert.equal(cut.html, `<div class="md"><article class="markdown-body">${heading('1.2')}<p>${'a'.repeat(50)}</p></article></div>`)
})

test('balanceHtml closes what is open and drops stray closing tags', () => {
  assert.equal(balanceHtml('<div><p>a<br>b'), '<div><p>a<br>b</p></div>')
  assert.equal(balanceHtml('a</p><ul><li>x</ul>'), 'a<ul><li>x</li></ul>')
  assert.equal(prepareReadme('<div><article><p>cut here', 'o', 'r').html, '<div><article><p>cut here</p></article></div>')
})

test('links in a file below the root resolve from its folder', () => {
  assert.equal(docDir('docs/ROADMAP.md'), 'docs/')
  assert.equal(docDir('CHANGELOG.md'), '')
  const { html } = prepareReadme('<a href="FEATURES.md">f</a><img src="img/a.png">', 'arn-c0de', 'Demo', 'docs/')
  assert.match(html, /href="https:\/\/github\.com\/arn-c0de\/Demo\/blob\/HEAD\/docs\/FEATURES\.md"/)
  assert.match(html, /data-src="https:\/\/raw\.githubusercontent\.com\/arn-c0de\/Demo\/HEAD\/docs\/img\/a\.png"/)
})
