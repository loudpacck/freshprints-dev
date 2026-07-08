// One-off: convert every PNG/JPG/JPEG in public/thumbnails/ and public/images/
// to a sibling .webp (quality 80, same dimensions). Originals are kept —
// they get deleted in a later cleanup pass once production is verified.
// Skips .svg/.glb and og-image.png (not in these dirs anyway).
//
// Usage: node scripts/convert-images-webp.js

import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), 'public')
const DIRS = ['thumbnails', 'images']
const EXTS = new Set(['.png', '.jpg', '.jpeg'])

async function collect(dir) {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...await collect(full))
    else if (EXTS.has(path.extname(e.name).toLowerCase())) out.push(full)
  }
  return out
}

function fmt(bytes) {
  return (bytes / 1024).toFixed(0).padStart(7) + ' KB'
}

const files = []
for (const d of DIRS) files.push(...await collect(path.join(ROOT, d)))

let totalBefore = 0
let totalAfter = 0
const rows = []

for (const file of files) {
  const target = file.replace(/\.(png|jpe?g)$/i, '.webp')
  await sharp(file).webp({ quality: 80 }).toFile(target)
  const before = (await stat(file)).size
  const after = (await stat(target)).size
  totalBefore += before
  totalAfter += after
  rows.push({ rel: path.relative(ROOT, file), before, after })
}

console.log('FILE'.padEnd(56) + 'BEFORE'.padStart(10) + 'AFTER'.padStart(10) + '  SAVED')
for (const { rel, before, after } of rows) {
  const saved = (100 - (after / before) * 100).toFixed(0) + '%'
  console.log(rel.padEnd(56) + fmt(before) + fmt(after) + '  ' + saved)
}
console.log('-'.repeat(84))
console.log(
  `TOTAL (${rows.length} files)`.padEnd(56) +
  fmt(totalBefore) + fmt(totalAfter) +
  '  ' + (100 - (totalAfter / totalBefore) * 100).toFixed(0) + '%'
)
