#!/usr/bin/env node
/**
 * Vendors shared/translator into nlide-api for InsForge deploy.
 * Deno Subhosting only bundles files under the function folder — repo-root shared/ is not uploaded.
 */
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'shared/translator')
const targetDir = join(root, 'insforge/functions/nlide-api/_shared/translator')

async function countTsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      count += await countTsFiles(path)
    } else if (entry.name.endsWith('.ts')) {
      count += 1
    }
  }
  return count
}

await mkdir(targetDir, { recursive: true })
await cp(sourceDir, targetDir, { recursive: true, force: true })

const fileCount = await countTsFiles(targetDir)
console.log(`Synced shared/translator → insforge/functions/nlide-api/_shared/translator (${fileCount} .ts files)`)
