import type { BuildJob, BuildPhase } from '@nlide/shared'
import { allPhaseJobs } from '@nlide/shared'
import type { ProgressChecklistPayload } from '../types/canvas'

export type BuildFocusSection = 'agent' | 'user'

export function phaseToChecklistPayload(phase: BuildPhase): ProgressChecklistPayload {
  const jobs = allPhaseJobs(phase)
  return {
    checklistId: phase.checklistId,
    phaseLabel: phase.title,
    readyLabel: `Ready for next phase — ${phase.agentModeGoal}`,
    blockedLabel: 'Complete agent work and your tasks below',
    items: jobs.map((job) => ({
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
  const jobs = allPhaseJobs(phase)
  const itemIds = jobs.map((job) => job.id)
  const done = countDone(phase.checklistId, itemIds)
  const total = itemIds.length
  return { done, total, ready: total > 0 && done === total }
}

export interface BuildFocus {
  phase: BuildPhase
  nextJob: BuildJob | null
  nextJobIndex: number
  nextSection: BuildFocusSection | null
  phaseReady: boolean
  allPhasesReady: boolean
}

function nextIncompleteJob(
  phase: BuildPhase,
  isItemDone: (checklistId: string, itemId: string) => boolean,
): { job: BuildJob; index: number; section: BuildFocusSection } | null {
  const agentJobs = phase.agentJobs ?? []
  for (let i = 0; i < agentJobs.length; i++) {
    const job = agentJobs[i]
    if (!isItemDone(phase.checklistId, job.id)) {
      return { job, index: i, section: 'agent' }
    }
  }

  const userJobs = phase.userJobs ?? []
  for (let i = 0; i < userJobs.length; i++) {
    const job = userJobs[i]
    if (!isItemDone(phase.checklistId, job.id)) {
      return { job, index: i, section: 'user' }
    }
  }

  const legacyJobs = phase.jobs ?? []
  for (let i = 0; i < legacyJobs.length; i++) {
    const job = legacyJobs[i]
    if (!isItemDone(phase.checklistId, job.id)) {
      return { job, index: i, section: 'agent' }
    }
  }

  return null
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

    const next = nextIncompleteJob(phase, isItemDone)
    return {
      phase,
      nextJob: next?.job ?? null,
      nextJobIndex: next?.index ?? -1,
      nextSection: next?.section ?? null,
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
    nextSection: null,
    phaseReady: true,
    allPhasesReady: true,
  }
}

export function progressBarSegments(fraction: number, segments = 10): string {
  const filled = Math.round(fraction * segments)
  return '█'.repeat(filled) + '░'.repeat(segments - filled)
}
