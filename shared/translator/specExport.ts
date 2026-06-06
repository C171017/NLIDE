/**
 * Spec export assembly — Phase 6 Agent mode.
 * Applies mdPatches + card sync → spec_sections rows → full exportedSpec tree.
 */

import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'
import {
  assembleSpecFile,
  generateIndexMd,
  getSpecFileLayout,
} from './specFolderLayout.ts'
import type { MdPatch } from './canvasTypes.ts'

export interface SpecSectionRow {
  file: string
  anchor: string
  content: string
}

export interface CardForExport {
  id: string
  specRef: { file: string; anchor?: string }
  type: string
  title: string
  body: string
  status?: string
}

export type ExportedSpec = Record<string, string>

function sectionKey(file: string, anchor: string): string {
  return `${file}\0${anchor}`
}

export function rowsToSectionMap(rows: SpecSectionRow[]): Map<string, SpecSectionRow> {
  const map = new Map<string, SpecSectionRow>()
  for (const row of rows) {
    map.set(sectionKey(row.file, row.anchor), row)
  }
  return map
}

export function sectionMapToRows(map: Map<string, SpecSectionRow>): SpecSectionRow[] {
  return [...map.values()]
}

function findCardForPatch(cards: CardForExport[], patch: MdPatch): CardForExport | undefined {
  if (!patch.anchor) return undefined

  return cards.find(
    (card) =>
      card.specRef.file === patch.file &&
      (card.specRef.anchor === patch.anchor ||
        card.id === patch.anchor ||
        card.specRef.anchor === patch.anchor),
  )
}

function parseFeatureTitleFromSummary(summary: string, entityId: string): string {
  const propose = summary.match(/^Propose\s+F-\d{3}\s+(.+)$/i)
  if (propose) return propose[1].trim()
  const add = summary.match(/^Add\s+F-\d{3}\s+(.+)$/i)
  if (add) return add[1].trim()
  return summary.replace(new RegExp(`^${entityId}\\s*`, 'i'), '').trim() || 'New feature'
}

function buildFeatureSection(entityId: string, title: string, description: string): string {
  return [
    `### ${entityId}: ${title}`,
    '',
    '- **Status:** proposed',
    '- **Priority:** medium',
    `- **Description:** ${description}`,
    '- **Acceptance criteria:**',
    '  - User-facing behavior matches the described intent',
    '  - Domain and access rules are enforced when applicable',
    '- **Related:** —',
  ].join('\n')
}

function buildOpenQuestionSection(
  anchor: string,
  title: string,
  question: string,
  context?: string,
): string {
  const heading = anchor.match(/^OQ-\d{3}$/) ? anchor : anchor
  return [
    `### ${heading}: ${title}`,
    '',
    '- **Status:** open',
    `- **Question:** ${question}`,
    context ? `- **Context:** ${context}` : '- **Context:** From translator preview',
  ].join('\n')
}

function buildGenericEntitySection(entityId: string, title: string, body: string): string {
  if (body.trim().startsWith('###')) return body.trim()
  return [`### ${entityId}: ${title}`, '', body.trim()].join('\n')
}

/** Build markdown section content for one mdPatch (stub-safe minimal shapes). */
export function patchToSectionContent(
  patch: MdPatch,
  cards: CardForExport[],
): string {
  if (patch.section?.trim()) {
    return patch.section.trim()
  }

  const card = findCardForPatch(cards, patch)
  const anchor = patch.anchor ?? patch.file
  const entityId = patch.anchor ?? 'section'

  if (card?.body.trim().startsWith('###')) {
    return card.body.trim()
  }

  if (patch.file === 'features.md' && /^F-\d{3}$/.test(entityId)) {
    const title = card?.title ?? parseFeatureTitleFromSummary(patch.summary, entityId)
    const description = card?.body?.trim() || patch.summary
    return buildFeatureSection(entityId, title.replace(/^F-\d{3}:\s*/i, ''), description)
  }

  if (patch.file === 'open-questions.md') {
    const title = card?.title ?? 'Open question'
    const question =
      card?.body?.replace(/^From chat:.*—\s*/i, '').trim() ||
      patch.summary.replace(/^Add open question about\s*/i, '') ||
      patch.summary
    return buildOpenQuestionSection(anchor, title.replace(/^Open question \(preview\)$/i, 'Domain allowlist'), question)
  }

  if (card) {
    return buildGenericEntitySection(entityId, card.title, card.body || patch.summary)
  }

  return buildGenericEntitySection(entityId, patch.summary, patch.summary)
}

export function applyMdPatchesToSectionMap(
  map: Map<string, SpecSectionRow>,
  patches: MdPatch[],
  cards: CardForExport[],
): Map<string, SpecSectionRow> {
  const next = new Map(map)

  for (const patch of patches) {
    if (patch.action === 'remove') {
      if (patch.anchor) {
        next.delete(sectionKey(patch.file, patch.anchor))
      }
      continue
    }

    const anchor = patch.anchor ?? ''
    const content = patchToSectionContent(patch, cards)
    next.set(sectionKey(patch.file, anchor), { file: patch.file, anchor, content })
  }

  return next
}

const PER_FILE_CARD_TYPES = new Set(['product', 'users', 'constraints', 'architecture', 'index'])

/** Sync preview/committed card bodies into spec_sections (card wins). */
export function syncCardsToSectionMap(
  map: Map<string, SpecSectionRow>,
  cards: CardForExport[],
): Map<string, SpecSectionRow> {
  const next = new Map(map)

  for (const card of cards) {
    const file = card.specRef.file
    if (!file || file === 'INDEX.md') continue

    const layout = getSpecFileLayout(file)
    if (!layout) continue

    const body = card.body?.trim()
    if (!body) continue

    if (PER_FILE_CARD_TYPES.has(card.type)) {
      const content = body.startsWith('#') ? body : `${layout.h1}\n\n${body}`
      next.set(sectionKey(file, ''), { file, anchor: '', content: content.trim() })
      continue
    }

    const anchor = card.specRef.anchor ?? card.id
    if (!body.startsWith('###')) {
      // Only sync entity cards with writer-shaped markdown; patches handle stub sections.
      continue
    }
    next.set(sectionKey(file, anchor), { file, anchor, content: body.trim() })
  }

  return next
}

export function extractSummaryParagraph(assembled: ExportedSpec, fallback: string): string {
  const product = assembled['product.md'] ?? ''
  const vision = product.match(/## Vision\s*\n+([\s\S]*?)(?=\n## |\n*$)/)?.[1]?.trim()
  if (vision && !vision.startsWith('_(')) return vision

  const features = assembled['features.md'] ?? ''
  const firstFeature = features.match(/- \*\*Description:\*\* (.+)/)?.[1]
  if (firstFeature) return firstFeature

  return fallback
}

/** Assemble full-tree exportedSpec from section rows. */
export function assembleFullExportedSpec(input: {
  projectName: string
  rows: SpecSectionRow[]
  exportedAt?: string
  summaryFallback?: string
}): ExportedSpec {
  const byFile = new Map<string, SpecSectionRow[]>()

  for (const row of input.rows) {
    if (row.file === 'INDEX.md') continue
    const list = byFile.get(row.file) ?? []
    list.push(row)
    byFile.set(row.file, list)
  }

  const exported: ExportedSpec = {}

  for (const file of SPEC_FILE_ALLOWLIST) {
    if (file === 'INDEX.md') continue
    const sections = byFile.get(file) ?? []
    exported[file] = assembleSpecFile(
      file,
      sections.map((s) => ({ anchor: s.anchor, content: s.content })),
    )
  }

  const summary = extractSummaryParagraph(
    exported,
    input.summaryFallback ?? 'Intent spec exported from NLIDE.',
  )

  exported['INDEX.md'] = generateIndexMd({
    projectName: input.projectName,
    summaryParagraph: summary,
    exportedAt: input.exportedAt,
  })

  return exported
}

/** Apply patches + card sync and return updated section rows. */
export function buildSectionRowsForCommit(input: {
  existingRows: SpecSectionRow[]
  patches: MdPatch[]
  cards: CardForExport[]
}): SpecSectionRow[] {
  let map = rowsToSectionMap(input.existingRows)
  map = applyMdPatchesToSectionMap(map, input.patches, input.cards)
  map = syncCardsToSectionMap(map, input.cards)
  return sectionMapToRows(map)
}
