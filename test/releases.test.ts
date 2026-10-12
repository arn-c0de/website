import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBytes } from '../lib/releases.ts'

test('file sizes read like a download page', () => {
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1536), '1.5 KB')
  assert.equal(formatBytes(5_400_000), '5.1 MB')
  assert.equal(formatBytes(250 * 1024 * 1024), '250 MB')
  assert.equal(formatBytes(3 * 1024 ** 3), '3.0 GB')
})
