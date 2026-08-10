/**
 * Module hooks that let the tests import the app's files unchanged.
 *
 * Three things the bundler does and plain Node does not: resolve the `@/…`
 * alias from tsconfig, fill in the extension a TypeScript import leaves off,
 * and accept a JSON import without `with { type: 'json' }`. Registered by
 * scripts/test-setup.mjs, which `npm test` passes to `--import`.
 */
import { existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** What a TypeScript import may leave off, in resolution order. */
const CANDIDATES = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx']

function firstExisting(path) {
  return CANDIDATES.map((suffix) => path + suffix).find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  )
}

export function resolve(specifier, context, next) {
  let path = null
  if (specifier.startsWith('@/')) path = join(root, specifier.slice(2))
  else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    path = fileURLToPath(new URL(specifier, context.parentURL))
  }
  // Bare specifiers — 'node:test', 'react' — are Node's business.
  if (path === null) return next(specifier, context)

  const resolved = firstExisting(path)
  if (!resolved) return next(specifier, context)

  const url = pathToFileURL(resolved).href
  if (!resolved.endsWith('.json')) return next(url, context)

  return { url, format: 'json', importAttributes: { type: 'json' }, shortCircuit: true }
}
