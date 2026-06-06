import { buildCanvasFromSpec } from '@nlide/shared/specToCanvas'
import type { CanvasState } from '../types/canvas'

const specModules = import.meta.glob('../../../spec/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function readSpecFiles(): Record<string, string> {
  const files: Record<string, string> = {}

  for (const [path, content] of Object.entries(specModules)) {
    const name = path.split('/').pop()
    if (name) {
      files[name] = content
    }
  }

  return files
}

export function loadSpecCanvas(): CanvasState {
  const built = buildCanvasFromSpec(readSpecFiles())

  return {
    centerCardId: built.centerCardId,
    cards: built.cards,
    edges: built.edges,
  }
}

export function loadSpecProjectName(): string {
  return buildCanvasFromSpec(readSpecFiles()).projectName
}
