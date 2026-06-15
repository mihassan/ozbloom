import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function findSpecFiles(dir) {
  const entries = readdirSync(dir)
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...findSpecFiles(full))
    } else if (entry.endsWith('.spec.ts')) {
      files.push(full)
    }
  }
  return files
}

const files = findSpecFiles('tests/e2e')

let hasWarnings = false

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/locator\(['"](\w+?)['"]\)/)
    if (match) {
      console.warn(`WARN: ${file}:${i + 1} — bare tag selector '${match[1]}' may match multiple elements. Use a more specific selector (e.g. '.card ${match[1]}').`)
      hasWarnings = true
    }
  }
}

if (hasWarnings) {
  process.exit(1)
}
