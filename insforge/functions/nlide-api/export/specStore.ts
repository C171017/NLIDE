import type { InsForgeClient } from 'npm:@insforge/sdk@latest'
import {
  assembleFullExportedSpec,
  buildSectionRowsForCommit,
  type CardForExport,
  type ExportedSpec,
  type SpecSectionRow,
} from '../_shared/translator/specExport.ts'
import type { MdPatch } from '../_shared/translator/canvasTypes.ts'
import { SPEC_FILE_ALLOWLIST } from '../_shared/translator/intentTypes.ts'
import { validateSpec } from '../validator/validateSpec.ts'

type DbSpecRow = {
  file: string
  anchor: string
  content: string
}

export async function loadSpecSections(
  client: InsForgeClient,
  projectId: string,
): Promise<SpecSectionRow[]> {
  const { data, error } = await client.database
    .from('spec_sections')
    .select('file,anchor,content')
    .eq('project_id', projectId)

  if (error) throw error

  return (data ?? []).map((row) => ({
    file: (row as DbSpecRow).file,
    anchor: (row as DbSpecRow).anchor ?? '',
    content: (row as DbSpecRow).content ?? '',
  }))
}

export async function saveSpecSections(
  client: InsForgeClient,
  projectId: string,
  rows: SpecSectionRow[],
): Promise<void> {
  const { error: deleteError } = await client.database
    .from('spec_sections')
    .delete()
    .eq('project_id', projectId)

  if (deleteError) throw deleteError

  if (rows.length === 0) return

  const insertRows = rows.map((row) => ({
    project_id: projectId,
    file: row.file,
    anchor: row.anchor,
    content: row.content,
  }))

  const { error: insertError } = await client.database.from('spec_sections').insert(insertRows)
  if (insertError) throw insertError
}

export type CommitExportResult =
  | { ok: true; exportedSpec: ExportedSpec; warnings: string[]; sectionCount: number }
  | {
      ok: false
      code: 'validation_failed'
      issues: Array<{ ruleId: string; message: string; file?: string }>
    }

export async function prepareCommitExport(input: {
  projectName: string
  existingRows: SpecSectionRow[]
  patches: MdPatch[]
  cards: CardForExport[]
}): Promise<CommitExportResult> {
  const rows = buildSectionRowsForCommit({
    existingRows: input.existingRows,
    patches: input.patches,
    cards: input.cards,
  })

  const exportedSpec = assembleFullExportedSpec({
    projectName: input.projectName,
    rows,
  })

  const validation = validateSpec({
    spec: exportedSpec,
    mode: 'commit',
  })

  if (!validation.ok) {
    return {
      ok: false,
      code: 'validation_failed',
      issues: [...validation.issues, ...validation.warnings].map((row) => ({
        ruleId: row.ruleId,
        message: row.message,
        file: row.file,
      })),
    }
  }

  return {
    ok: true,
    exportedSpec,
    warnings: validation.warnings.map((row) => row.message),
    sectionCount: rows.length,
  }
}

export function assertExportedSpecComplete(exportedSpec: ExportedSpec): string[] {
  const failures: string[] = []

  for (const file of SPEC_FILE_ALLOWLIST) {
    if (!exportedSpec[file]?.trim()) {
      failures.push(`missing or empty ${file}`)
    }
  }

  if (!exportedSpec['INDEX.md']?.includes('Agent routing rules')) {
    failures.push('INDEX.md missing agent routing rules')
  }

  return failures
}

export async function loadProjectName(
  client: InsForgeClient,
  projectId: string,
): Promise<string> {
  const { data, error } = await client.database
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw error
  return (data?.name as string | undefined) ?? 'NLIDE Demo Project'
}
