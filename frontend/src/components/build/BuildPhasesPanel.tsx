import { useMemo } from 'react'
import { useExecutionPlan } from '../../hooks/useExecutionPlan'
import { phaseProgress, progressBarSegments, resolveBuildFocus } from '../../lib/buildPhaseUtils'
import {
  countDone,
  isItemDone,
  useImplementationProgressStore,
} from '../../store/implementationProgressStore'
import ExecutionPlanActions from './ExecutionPlanActions'
import PhaseJobList from './PhaseJobList'

export default function BuildPhasesPanel() {
  const {
    phases,
    previewPlan,
    activePlan,
    regenerate,
    commit,
    discard,
    isLoading,
    isBootstrapping,
    error,
    specSource,
    hasPlan,
  } = useExecutionPlan()

  const completed = useImplementationProgressStore((state) => state.completed)

  const focus = useMemo(
    () =>
      phases.length > 0
        ? resolveBuildFocus(
            phases,
            (checklistId, itemId) => isItemDone(completed, checklistId, itemId),
            (checklistId, itemIds) => countDone(completed, checklistId, itemIds),
          )
        : null,
    [phases, completed],
  )

  const activeProgress = focus
    ? phaseProgress(focus.phase, (checklistId, itemIds) =>
        countDone(completed, checklistId, itemIds),
      )
    : { done: 0, total: 0, ready: false }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa3b2]">
            Execution plan
          </p>
          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={isLoading || isBootstrapping}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#e5e7eb] hover:bg-white/10 disabled:opacity-50"
          >
            {isLoading ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>

        {error && (
          <p className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        {previewPlan && activePlan && (
          <ExecutionPlanActions
            summary={activePlan.summary}
            onCommit={() => void commit()}
            onDiscard={() => void discard()}
            isLoading={isLoading}
          />
        )}

        {focus && !focus.allPhasesReady && hasPlan && (
          <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
              You are here
            </p>
            <p className="mt-1 text-sm font-medium text-[#f3f4f6]">
              {focus.phase.title}
              {!focus.phaseReady && focus.nextJobIndex >= 0 && (
                <span className="text-sky-200">
                  {' '}
                  · Task {focus.nextJobIndex + 1}/{focus.phase.jobs.length}
                </span>
              )}
            </p>
            {focus.nextJob ? (
              <p className="mt-1 text-xs text-[#d1d5db]">{focus.nextJob.label}</p>
            ) : (
              <p className="mt-1 text-xs text-emerald-200">Phase complete — move to next phase.</p>
            )}
            <p className="mt-2 font-mono text-[10px] text-sky-300/90">
              [{progressBarSegments(activeProgress.total > 0 ? activeProgress.done / activeProgress.total : 0)}]{' '}
              {activeProgress.done}/{activeProgress.total}
            </p>
          </div>
        )}

        {focus?.allPhasesReady && (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            All execution phases complete. Export spec and hand off to external agents.
          </p>
        )}

        <p className="mt-2 text-[10px] text-[#6b7280]">
          Plan input: synthesis + full MD ({specSource})
          {activePlan?.model ? ` · planner: ${activePlan.model}` : ''}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-auto p-3 pb-4">
        {!hasPlan && !isBootstrapping && (
          <p className="rounded-xl border border-white/10 bg-[#141824]/60 px-3 py-4 text-center text-xs text-[#9aa3b2]">
            Add tasks to <span className="font-mono text-[#d1d5db]">tasks.md</span>, then click{' '}
            <span className="font-medium text-[#e5e7eb]">Regenerate</span> to build an execution
            plan from your spec.
          </p>
        )}

        {phases.map((phase) => (
          <PhaseJobList
            key={phase.id}
            phase={phase}
            defaultExpanded={phase.checklistId === focus?.phase.checklistId}
            currentChecklistId={focus?.phase.checklistId}
            currentJobId={focus?.nextJob?.id}
          />
        ))}
      </div>
    </div>
  )
}
