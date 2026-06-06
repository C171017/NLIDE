import type { MdPatch } from '../_shared/translator/canvasTypes.ts'
import {
  applyMdPatchesToSectionMap,
  parseSpecFileToSectionRows,
  rowsToSectionMap,
  sectionMapToRows,
  type SpecSectionRow,
} from '../_shared/translator/specExport.ts'
import { assembleSpecFile } from '../_shared/translator/specFolderLayout.ts'
import type { RouterPlan } from '../_shared/translator/types.ts'
import { writeFeaturesSection } from './featuresWriter.ts'
import { writeRemainingSection } from './remainingWriter.ts'
import { writeTaskSection } from './taskWriter.ts'
import {
  findFeaturesOperation,
  findOperation,
  findTasksOperation,
  type RunWritersInput,
  type RunWritersResult,
  type WriterPatch,
} from './types.ts'

const REMAINING_FILE_ORDER = [
  'constraints.md',
  'decisions.md',
  'open-questions.md',
  'product.md',
  'users.md',
  'architecture.md',
] as const

function baseSpecToSectionMap(base: Record<string, string>): Map<string, SpecSectionRow> {
  const rows: SpecSectionRow[] = []
  for (const [file, content] of Object.entries(base)) {
    if (file === 'INDEX.md') continue
    rows.push(...parseSpecFileToSectionRows(file, content))
  }
  return rowsToSectionMap(rows)
}

function uniqueTargets(plan: RouterPlan): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []

  const push = (target: string) => {
    if (!seen.has(target)) {
      seen.add(target)
      ordered.push(target)
    }
  }

  push('features.md')
  push('tasks.md')
  for (const file of REMAINING_FILE_ORDER) {
    if (plan.operations.some((op) => op.target === file)) {
      push(file)
    }
  }

  return ordered
}

/** Run all writers for router operations — features first, then tasks, then remaining files. */
export async function runWritersFromPlan(input: RunWritersInput): Promise<RunWritersResult> {
  const { userMessage, routerPlan } = input
  const patches: WriterPatch[] = []
  const models: string[] = []
  let linkedFeatureId: string | undefined

  const featuresOp = findFeaturesOperation(routerPlan)
  if (featuresOp) {
    const result = await writeFeaturesSection({
      userMessage,
      routerPlan,
      existingFeatureIds: input.existingFeatureIds,
      existingSection: input.existingSpec?.['features.md'],
    })

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
          validationIssues: result.error.validationIssues,
          failedWriter: 'features.md',
        },
      }
    }

    linkedFeatureId = result.entityId
    patches.push({
      file: 'features.md',
      action: result.action,
      anchor: result.entityId,
      section: result.section,
      entityId: result.entityId,
    })
    models.push(result.model)
  }

  const tasksOp = findTasksOperation(routerPlan)
  if (tasksOp) {
    const result = await writeTaskSection({
      userMessage,
      routerPlan,
      existingTaskIds: input.existingTaskIds,
      existingSection: input.existingSpec?.['tasks.md'],
      linkedFeatureId,
    })

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
          validationIssues: result.error.validationIssues,
          failedWriter: 'tasks.md',
        },
      }
    }

    patches.push({
      file: 'tasks.md',
      action: result.action,
      anchor: result.entityId,
      section: result.section,
      entityId: result.entityId,
    })
    models.push(result.model)
  }

  for (const targetFile of REMAINING_FILE_ORDER) {
    const op = findOperation(routerPlan, targetFile)
    if (!op) continue

    const existingEntityIds =
      targetFile === 'decisions.md'
        ? input.existingDecisionIds
        : targetFile === 'open-questions.md'
          ? input.existingOpenQuestionIds
          : undefined

    const result = await writeRemainingSection({
      userMessage,
      routerPlan,
      targetFile,
      existingContent: input.existingSpec?.[targetFile],
      existingEntityIds,
    })

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
          validationIssues: result.error.validationIssues,
          failedWriter: targetFile,
        },
      }
    }

    patches.push({
      file: targetFile,
      action: result.action,
      anchor: result.entityId,
      section: result.section,
      entityId: result.entityId,
    })
    models.push(result.model)
  }

  return { ok: true, patches, models }
}

/** Apply writer patches into a spec file map for validation (section-level merge). */
export function applyPatchesToSpec(
  base: Record<string, string>,
  patches: WriterPatch[],
): Record<string, string> {
  if (patches.length === 0) {
    return { ...base }
  }

  let map = baseSpecToSectionMap(base)
  const mdPatches: MdPatch[] = patches.map((patch) => ({
    file: patch.file,
    action: patch.action,
    anchor: patch.anchor ?? patch.entityId,
    summary: `${patch.action} ${patch.anchor ?? patch.entityId ?? ''}`.trim(),
    section: patch.section,
  }))

  map = applyMdPatchesToSectionMap(map, mdPatches, [])

  const next = { ...base }
  const rowsByFile = new Map<string, SpecSectionRow[]>()
  for (const row of sectionMapToRows(map)) {
    const list = rowsByFile.get(row.file) ?? []
    list.push(row)
    rowsByFile.set(row.file, list)
  }

  for (const [file, rows] of rowsByFile) {
    next[file] = assembleSpecFile(
      file,
      rows.map((row) => ({ anchor: row.anchor, content: row.content })),
    )
  }

  return next
}

export function listWriterTargets(plan: RouterPlan): string[] {
  return uniqueTargets(plan)
}
