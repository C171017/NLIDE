import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'
import { extractEntityIds } from './extractEntityIds.ts'

const ENTITY_FILE_PREFIX: Record<string, string> = {
  'tasks.md': 'T',
  'features.md': 'F',
  'decisions.md': 'D',
  'open-questions.md': 'OQ',
}

function bodyAfterH1(content: string): string {
  return content.replace(/^#[^\n]*\n+/, '').trim()
}

function pickFileContent(file: string, fromCanvas: string, fromRepo: string): string {
  const prefix = ENTITY_FILE_PREFIX[file]
  if (prefix) {
    const canvasIds = extractEntityIds(fromCanvas, prefix)
    const repoIds = extractEntityIds(fromRepo, prefix)
    if (canvasIds.length > 0 && canvasIds.length >= repoIds.length) return fromCanvas
    if (repoIds.length > 0) return fromRepo
    return fromCanvas.trim() || fromRepo
  }

  const canvasBody = bodyAfterH1(fromCanvas)
  const repoBody = bodyAfterH1(fromRepo)
  const canvasUsable = canvasBody.length > 0 && !canvasBody.startsWith('_(')
  const repoUsable = repoBody.length > 0 && !repoBody.startsWith('_(')

  if (canvasUsable && (!repoUsable || canvasBody.length >= repoBody.length)) return fromCanvas
  if (repoUsable) return fromRepo
  return fromCanvas.trim() || fromRepo
}

/** Merge repo/base MD with canvas-assembled MD — full spec for execution planning. */
export function mergeExecutionPlanSpec(input: {
  fromCanvas: Record<string, string>
  fromRepo: Record<string, string>
}): Record<string, string> {
  const merged: Record<string, string> = {}

  for (const file of SPEC_FILE_ALLOWLIST) {
    merged[file] = pickFileContent(
      file,
      input.fromCanvas[file] ?? '',
      input.fromRepo[file] ?? '',
    )
  }

  return merged
}

/** Client-assembled spec wins per file when non-empty; Postgres fills gaps only. */
export function resolveExecutionPlannerSpec(input: {
  clientBundle: Record<string, string>
  fromPostgres?: Record<string, string>
}): Record<string, string> {
  const merged: Record<string, string> = {}
  const pg = input.fromPostgres ?? {}

  for (const file of SPEC_FILE_ALLOWLIST) {
    const client = input.clientBundle[file]?.trim() ?? ''
    const postgres = pg[file]?.trim() ?? ''
    merged[file] = client || postgres
  }

  return merged
}
