#!/usr/bin/env node
/**
 * Vendors shared/translator, then bundles nlide-api into a single deploy file.
 * InsForge Subhosting does not reliably trace multi-file local imports.
 */
import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const syncScript = join(root, 'scripts/sync-translator-spec.mjs')
const entry = join(root, 'insforge/functions/nlide-api/index.ts')
const outDir = join(root, 'insforge/functions/nlide-api/dist')
const output = join(outDir, 'index.ts')

const sync = spawnSync(process.execPath, [syncScript], { stdio: 'inherit', cwd: root })
if (sync.status !== 0) {
  process.exit(sync.status ?? 1)
}

await mkdir(outDir, { recursive: true })

const bundle = spawnSync(
  'npx',
  [
    'esbuild',
    entry,
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--outfile=' + output,
    '--external:npm:@insforge/sdk@latest',
    '--external:npm:zod@3.23.8',
  ],
  { stdio: 'inherit', cwd: root },
)

if (bundle.status !== 0) {
  process.exit(bundle.status ?? 1)
}

console.log(`Bundled nlide-api → ${output.replace(root + '/', '')}`)
