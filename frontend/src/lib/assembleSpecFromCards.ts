import {
  assembleFullExportedSpec,
  assembleSpecFile,
  rowsToSectionMap,
  syncCardsToSectionMap,
} from '@nlide/shared'
import type { Card } from '../types/canvas'

export function assembleSpecFileFromCards(
  file: string,
  cards: Card[],
  projectName: string,
): string {
  const map = syncCardsToSectionMap(rowsToSectionMap([]), cards)

  if (file === 'INDEX.md') {
    return assembleFullExportedSpec({
      projectName,
      rows: [...map.values()],
    })['INDEX.md']
  }

  const sections = [...map.values()]
    .filter((row) => row.file === file)
    .map((row) => ({ anchor: row.anchor, content: row.content }))

  return assembleSpecFile(file, sections)
}
