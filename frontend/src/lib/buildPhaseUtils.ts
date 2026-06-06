import type { BuildJob, BuildPhase } from '@nlide/shared'
import type { ProgressChecklistPayload } from '../types/canvas'

export function phaseToChecklistPayload(phase: BuildPhase): ProgressChecklistPayload {
  return {
    checklistId: phase.checklistId,
    phaseLabel: phase.title,
    readyLabel: `Ready for Agent mode — ${phase.agentModeGoal}`,
    blockedLabel: 'Finish the jobs below, then switch to Agent mode',
    items: phase.jobs.map((job) => ({
      id: job.id,
      label: job.label,
      detail: job.detail,
    })),
  }
}

export function phaseProgress(
  phase: BuildPhase,
  countDone: (checklistId: string, itemIds: string[]) => number,
): { done: number; total: number; ready: boolean } {
  const itemIds = phase.jobs.map((job) => job.id)
  const done = countDone(phase.checklistId, itemIds)
  const total = itemIds.length
  return { done, total, ready: total > 0 && done === total }
}

export interface BuildFocus {
  phase: BuildPhase
  nextJob: BuildJob | null
  nextJobIndex: number
  phaseReady: boolean
  allPhasesReady: boolean
}

export function resolveBuildFocus(
  phases: BuildPhase[],
  isItemDone: (checklistId: string, itemId: string) => boolean,
  countDone: (checklistId: string, itemIds: string[]) => number,
): BuildFocus | null {
  const ordered = [...phases].sort((a, b) => a.order - b.order)

  for (const phase of ordered) {
    const { ready } = phaseProgress(phase, countDone)
    if (ready) continue

    const nextJobIndex = phase.jobs.findIndex((job) => !isItemDone(phase.checklistId, job.id))
    return {
      phase,
      nextJob: nextJobIndex >= 0 ? phase.jobs[nextJobIndex] : null,
      nextJobIndex,
      phaseReady: false,
      allPhasesReady: false,
    }
  }

  const last = ordered[ordered.length - 1]
  if (!last) return null

  return {
    phase: last,
    nextJob: null,
    nextJobIndex: -1,
    phaseReady: true,
    allPhasesReady: true,
  }
}

export function progressBarSegments(fraction: number, segments = 10): string {
  const filled = Math.round(fraction * segments)
  return '█'.repeat(filled) + '░'.repeat(segments - filled)
}
