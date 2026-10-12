/**
 * Derives every icon on the site from one source image.
 *
 *   node scripts/generate-icons.mjs
 *
 * Run it after replacing images/profile/avatar.jpeg and commit the results —
 * the outputs are checked in, so no build step depends on this.
 *
 * sharp comes in as a Next dependency; nothing extra needs installing.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'images/profile/avatar.jpeg')
const p = (...parts) => join(root, ...parts)

const square = (size) => sharp(src).resize(size, size, { fit: 'cover' })

// app/icon.png and app/apple-icon.png are Next file conventions: they are
// served, linked in <head> and base-path-prefixed automatically.
await square(256).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(p('app/icon.png'))
await square(180).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(p('app/apple-icon.png'))

// Referenced explicitly from app/manifest.ts.
await square(192).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(p('public/icon-192.png'))
await square(512).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(p('public/icon-512.png'))

// Maskable icons get cropped to a circle by launchers, so the photo is inset
// into the 80% safe zone over the app background rather than filling the tile.
const inner = await square(410).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0a0c10' } })
  .composite([{ input: inner, top: 51, left: 51 }])
  .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
  .toFile(p('public/icon-maskable.png'))

// Shown in the top bar at 26px and in the overview hero at 60px, so 96px
// covers 2x and 3x on the one and 1.6x on the other.
await sharp(src)
  .resize(96, 96, { fit: 'cover' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(p('public/avatar.jpg'))

// The about page shows the portrait at 112px; this is the source at full
// resolution, which covers well past 3x.
await sharp(src)
  .resize(400, 400, { fit: 'cover' })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(p('public/avatar-large.jpg'))

console.log('icons regenerated from', src)
