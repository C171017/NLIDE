import {
  assembleFullExportedSpec,
  buildSectionRowsForCommit,
  type SpecSectionRow,
} from '../_shared/translator/specExport.ts'
import { EXPORT_SMOKE_PASS_BAR } from '../_shared/translator/exportEndToEndSmoke.ts'
import { assertExportedSpecComplete } from './specStore.ts'

/** Headless Phase 6 smoke — assemble export from fixture sections + stub patches (no DB). */
export function runExportSmoke() {
  const existingRows: SpecSectionRow[] = []

  const patches = [
    {
      file: 'features.md',
      action: 'add' as const,
      anchor: 'F-004',
      summary: 'Propose F-004 Google login feature',
    },
    {
      file: 'open-questions.md',
      action: 'add' as const,
      anchor: 'OQ-001',
      summary: 'Add open question about allowed Google domains',
    },
  ]

  const cards = [
    {
      id: 'oq-smoke',
      specRef: { file: 'open-questions.md', anchor: 'OQ-001' },
      type: 'open-question',
      title: 'Domain allowlist',
      body: 'Which enterprise domains should be allowed for Google login?',
    },
  ]

  const rows = buildSectionRowsForCommit({ existingRows, patches, cards })
  const exportedSpec = assembleFullExportedSpec({
    projectName: 'NLIDE Demo Project',
    rows,
    exportedAt: '2026-06-06',
  })

  const failures = assertExportedSpecComplete(exportedSpec)

  if (!exportedSpec['features.md']?.includes('### F-004:')) {
    failures.push('features.md missing F-004 section')
  }

  if (!exportedSpec['open-questions.md']?.includes('### OQ-001:')) {
    failures.push('open-questions.md missing OQ-001 section')
  }

  const fileCount = Object.keys(exportedSpec).length

  return {
    ok: failures.length === 0,
    passBar: EXPORT_SMOKE_PASS_BAR,
    passed: failures.length === 0,
    fileCount,
    expectedFileCount: 9,
    failures,
    exportedSpec,
    sectionCount: rows.length,
  }
}
