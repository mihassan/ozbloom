import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
let exitCode = 0

function check(relativePath, source) {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('//')) {
    return
  }
  const full = resolve(dist, relativePath)
  if (!existsSync(full)) {
    console.error(`  MISSING: ${relativePath} (referenced in ${source})`)
    exitCode = 1
  } else {
    console.log(`  OK: ${relativePath}`)
  }
}

// Parse index.html
const htmlPath = resolve(dist, 'index.html')
if (!existsSync(htmlPath)) {
  console.error('dist/index.html not found — run build first')
  process.exit(1)
}

console.log('\nChecking assets referenced in index.html...')
const html = readFileSync(htmlPath, 'utf-8')

for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
  check(m[1].replace(/^\//, ''), 'index.html <script>')
}

for (const m of html.matchAll(/<link[^>]+href="([^"]+)"/g)) {
  check(m[1].replace(/^\//, ''), 'index.html <link>')
}

// Parse manifest.json for icons
const manifestPath = resolve(dist, 'manifest.json')
if (existsSync(manifestPath)) {
  console.log('\nChecking icons referenced in manifest.json...')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  if (manifest.icons) {
    for (const icon of manifest.icons) {
      check(icon.src.replace(/^\//, ''), 'manifest.json icons')
    }
  }
}

console.log('')
if (exitCode === 0) {
  console.log('All assets present.')
} else {
  console.error('Some assets are missing!')
}
process.exit(exitCode)
