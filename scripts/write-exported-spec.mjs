#!/usr/bin/env node
/**
 * Write exportedSpec from commit API response to repo spec/ (Phase 6 smoke helper).
 * Usage:
 *   npm run write:spec -- /tmp/nlide-commit.json
 *   cat commit.json | npm run write:spec
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const specDir = path.join(repoRoot, 'spec')

function readInput() {
  const fileArg = process.argv[2]
  if (fileArg) {
    return fs.readFileSync(path.resolve(fileArg), 'utf8')
  }
  return fs.readFileSync(0, 'utf8')
}

const raw = readInput().trim()
if (!raw) {
  console.error('write-exported-spec: empty input')
  process.exit(1)
}

let payload
try {
  payload = JSON.parse(raw)
} catch {
  console.error('write-exported-spec: invalid JSON')
  process.exit(1)
}

const exportedSpec = payload.exportedSpec ?? payload
if (!exportedSpec || typeof exportedSpec !== 'object' || Array.isArray(exportedSpec)) {
  console.error('write-exported-spec: missing exportedSpec object in JSON')
  process.exit(1)
}

fs.mkdirSync(specDir, { recursive: true })

const files = Object.keys(exportedSpec).sort()
if (files.length === 0) {
  console.error('write-exported-spec: exportedSpec has no files')
  process.exit(1)
}

for (const file of files) {
  if (file.includes('/') || file.includes('..')) {
    console.error(`write-exported-spec: rejected unsafe filename ${file}`)
    process.exit(1)
  }
  const content = exportedSpec[file]
  if (typeof content !== 'string') {
    console.error(`write-exported-spec: ${file} content is not a string`)
    process.exit(1)
  }
  const dest = path.join(specDir, file)
  fs.writeFileSync(dest, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  console.log(`wrote spec/${file}`)
}

console.log(`done — ${files.length} file(s) in spec/`)
