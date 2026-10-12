/**
 * Prepares the per-project icons the cards and the detail panel show.
 *
 *   node scripts/generate-repo-icons.mjs
 *
 * Drop an image into images/repo_icons/ named after the repository — case,
 * dashes and spaces do not matter, `GPG-Meister.png` and `gpgmeister.png`
 * both land on the same repo. Run this, commit the results: it writes a
 * square 128px WebP per icon into public/repo-icons/ and the list of repos
 * that have one into data/repo-icons.json, which is what the app reads.
 *
 * Sources stay out of public/ on purpose — some are multi-megabyte artwork
 * and only the resized copies belong in the deploy.
 *
 * sharp comes in as a Next dependency; nothing extra needs installing.
 */
import sharp from 'sharp'
import { readdirSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, extname, basename, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'images/repo_icons')
const outDir = join(root, 'public/repo-icons')

const SIZE = 128
const SOURCES = ['.png', '.jpg', '.jpeg', '.webp', '.avif']

/** Same normalisation the app applies to a repository name. */
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

const files = readdirSync(srcDir).filter((f) => SOURCES.includes(extname(f).toLowerCase()))

// Rebuilt from scratch, so removing a source removes its icon as well.
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const slugs = []

for (const file of files) {
  const key = slug(basename(file, extname(file)))
  await sharp(join(srcDir, file))
    // `contain` rather than `cover`: these are logos, and cropping one to a
    // square is how a logo stops being recognisable.
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(join(outDir, `${key}.webp`))
  slugs.push(key)
  console.log(`${file} → public/repo-icons/${key}.webp`)
}

slugs.sort()
writeFileSync(join(root, 'data/repo-icons.json'), `${JSON.stringify(slugs, null, 2)}\n`)
console.log(`\n${slugs.length} icon(s), listed in data/repo-icons.json`)
