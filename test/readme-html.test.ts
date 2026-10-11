import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareReadme, unparkImages } from '../lib/readmeHtml.ts'

const prep = (html: string) => prepareReadme(html, 'arn-c0de', 'Demo')

test('drops executable markup', () => {
  const { html } = prep(
    '<p onclick="x()">a</p><script>alert(1)</script><style>p{}</style><iframe src="https://e.x"></iframe><a href="javascript:alert(1)">b</a><a href="java\tscript:x">c</a>',
  )
  assert.doesNotMatch(html, /script>|<style|<iframe|onclick|javascript:/i)
  assert.match(html, /<p>a<\/p>/)
})

test('resolves relative links and images against the repository', () => {
  const { html } = prep('<a href="docs/a.md">d</a><img src="./img/x.png" alt="x">')
  assert.match(html, /href="https:\/\/github\.com\/arn-c0de\/Demo\/blob\/HEAD\/docs\/a\.md"/)
  assert.match(html, /data-src="https:\/\/raw\.githubusercontent\.com\/arn-c0de\/Demo\/HEAD\/img\/x\.png"/)
})

test('parks images until asked for, and counts them', () => {
  const { html, images } = prep('<img src="https://e.x/a.png"><img src="https://e.x/b.png" srcset="b2.png 2x"/>')
  assert.equal(images, 2)
  assert.doesNotMatch(html, /\ssrc=|srcset/)
  assert.equal((unparkImages(html).match(/\ssrc="/g) ?? []).length, 2)
})

test('links open in a new tab without a referrer', () => {
  const { html } = prep('<a href="https://e.x" target="_self" rel="opener">e</a>')
  assert.match(html, /<a href="https:\/\/e\.x" target="_blank" rel="noopener noreferrer">/)
})

test('removes GitHub heading anchors', () => {
  const { html } = prep('<h2><a class="anchor" href="#x"><svg class="octicon octicon-link"></svg></a>Title</h2>')
  assert.equal(html, '<h2>Title</h2>')
})
