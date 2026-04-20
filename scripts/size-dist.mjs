import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = process.cwd()

const distDir = path.join(root, 'packages', '@reactzero/lattice', 'dist')

const targets = [
  ['@reactzero/lattice', ['index.js']],
  ['@reactzero/lattice/core', ['core/index.js', 'core/engine.js', 'core/types.js', 'core/utils.js']],
  ['@reactzero/lattice/react', ['react/index.js', 'react/components.js', 'react/hooks.js', 'react/utils.js']],
  ['@reactzero/lattice/filter', ['filter.js']],
  ['@reactzero/lattice/sort', ['sort.js']],
  ['@reactzero/lattice/paginate', ['paginate.js']],
]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function readSize(absPath) {
  const code = fs.readFileSync(absPath)
  return {
    raw: code.byteLength,
    gzip: gzipSync(code).byteLength,
  }
}

const rows = []

for (const [pkgName, files] of targets) {
  for (const file of files) {
    const abs = path.join(distDir, file)
    if (!fs.existsSync(abs)) {
      rows.push({ pkgName, file, raw: null, gzip: null })
      continue
    }

    const { raw, gzip } = readSize(abs)
    rows.push({ pkgName, file, raw, gzip })
  }
}

const widthPkg = Math.max(...rows.map(r => r.pkgName.length), 'Package'.length)
const widthFile = Math.max(...rows.map(r => r.file.length), 'Entrypoint'.length)

const header = [
  'Package'.padEnd(widthPkg),
  'Entrypoint'.padEnd(widthFile),
  'Raw'.padStart(12),
  'Gzip'.padStart(12),
].join('  ')

console.log(header)
console.log('-'.repeat(header.length))

for (const row of rows) {
  const raw = row.raw == null ? 'missing'.padStart(12) : formatBytes(row.raw).padStart(12)
  const gzip = row.gzip == null ? 'missing'.padStart(12) : formatBytes(row.gzip).padStart(12)
  console.log([
    row.pkgName.padEnd(widthPkg),
    row.file.padEnd(widthFile),
    raw,
    gzip,
  ].join('  '))
}
