import {
  SPEC_FILE_ALLOWLIST,
  buildCardSynthesis,
  mergeExecutionPlanSpec,
  type CardSynthesisBundle,
  type ExecutionPlanInput,
} from '@nlide/shared'
import type { Card } from '../types/canvas'
import { assembleSpecFileFromCards } from './assembleSpecFromCards'
import { getLocalSpecFile } from './localSpecFiles'

export type ExecutionPlanInputSource = 'merged' | 'repo'

/** Assemble full agent MD (repo + canvas merge) + human card synthesis for execution planning. */
export function assembleExecutionPlanInput(
  cards: Card[],
  projectName: string,
): { input: ExecutionPlanInput; source: ExecutionPlanInputSource } {
  const synthesis = buildCardSynthesis(cards)

  const fromCanvas: Record<string, string> = {}
  const fromRepo: Record<string, string> = {}

  for (const file of SPEC_FILE_ALLOWLIST) {
    fromCanvas[file] = assembleSpecFileFromCards(file, cards, projectName)
    fromRepo[file] = getLocalSpecFile(file) ?? ''
  }

  const spec = mergeExecutionPlanSpec({ fromCanvas, fromRepo })

  const usedRepo = SPEC_FILE_ALLOWLIST.some(
    (file) => file !== 'INDEX.md' && spec[file] === fromRepo[file] && fromRepo[file]?.trim(),
  )
  const usedCanvas = SPEC_FILE_ALLOWLIST.some(
    (file) => file !== 'INDEX.md' && spec[file] === fromCanvas[file] && fromCanvas[file]?.trim(),
  )

  return {
    input: { spec, synthesis, projectName },
    source: usedRepo && usedCanvas ? 'merged' : usedRepo ? 'repo' : 'merged',
  }
}

export type { CardSynthesisBundle, ExecutionPlanInput }
