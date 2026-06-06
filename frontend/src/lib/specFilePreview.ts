import {
  applyMdPatchesToFileContent,
  extractEntitySection,
} from '@nlide/shared'
import type { Card, PreviewPayload } from '../types/canvas'

export interface EntitySectionPreview {
  committedSection: string
  proposedSection: string
  hasPreview: boolean
}

function patchTargetsAnchor(
  preview: PreviewPayload,
  file: string,
  anchor: string,
): boolean {
  return preview.mdPatches.some(
    (patch) =>
      patch.file === file && patch.anchor === anchor && patch.action !== 'remove',
  )
}

/** Build committed vs proposed entity sections for the card editor MD panel. */
export function buildEntitySectionPreview(
  file: string,
  anchor: string | undefined,
  committedFileContent: string,
  preview: PreviewPayload | null,
  cards: Card[],
): EntitySectionPreview {
  if (!anchor?.trim() || !committedFileContent.trim()) {
    return { committedSection: '', proposedSection: '', hasPreview: false }
  }

  const committedSection = extractEntitySection(committedFileContent, anchor)

  if (!preview || !patchTargetsAnchor(preview, file, anchor)) {
    return { committedSection, proposedSection: '', hasPreview: false }
  }

  const proposedFileContent = applyMdPatchesToFileContent(
    file,
    committedFileContent,
    preview.mdPatches,
    cards,
  )
  const proposedSection = extractEntitySection(proposedFileContent, anchor)

  const hasPreview =
    proposedSection.trim().length > 0 && proposedSection.trim() !== committedSection.trim()

  return { committedSection, proposedSection, hasPreview }
}
