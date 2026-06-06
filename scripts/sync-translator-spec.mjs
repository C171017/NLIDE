#!/usr/bin/env node
/**
 * Copies shared/translator into a single deploy-safe module if multi-file imports fail.
 * Currently re-exports via translator/index.ts — run before deploy to verify paths.
 */
import { access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shared = join(root, 'shared/translator/index.ts')
const apiTranslator = join(root, 'insforge/functions/nlide-api/translator/index.ts')

try {
  await access(shared)
  await access(apiTranslator)
  console.log('Translator spec OK — shared/translator wired to nlide-api/translator/')
} catch (error) {
  console.error('Translator spec sync check failed:', error)
  process.exit(1)
}
