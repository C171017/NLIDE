import { useMemo } from 'react'
import { allPhaseJobs } from '@nlide/shared'
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
    exportHandoff,
    isLoading,
    isExporting,
    exportMessage,
    isBootstrapping,
    error,
    warnings,
    hasPlan,
    planStale,
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
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void exportHandoff()}
              disabled={isLoading || isBootstrapping || isExporting || !hasPlan}
              title={
                hasPlan
                  ? 'Download execution handoff zip (spec, synthesis, phased agent briefs)'
                  : 'Regenerate and commit a plan first'
              }
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#e5e7eb] hover:bg-white/10 disabled:opacity-50"
            >
              {isExporting ? 'Exporting…' : 'Export'}
            </button>
            <button
              type="button"
              onClick={() => void regenerate()}
              disabled={isLoading || isBootstrapping || isExporting}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#e5e7eb] hover:bg-white/10 disabled:opacity-50"
            >
              {isLoading ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </div>

        {exportMessage && (
          <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-200">
            {exportMessage}
          </p>
        )}

        {warnings.length > 0 && (
          <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-100">
            <p className="font-medium text-amber-50">Planner notes</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-amber-100/90">
              {warnings.map((issue) => (
                <li key={`${issue.ruleId}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-2 text-xs text-red-200">
            <p>{error.message}</p>
            {error.issues.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-red-200/90">
                {error.issues.map((issue) => (
                  <li key={`${issue.ruleId}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            )}
            {error.zodIssues.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-red-200/90">
                {error.zodIssues.map((issue) => (
                  <li key={`${issue.path ?? 'schema'}-${issue.message}`}>
                    {issue.path ? `${issue.path}: ` : ''}
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                  · {focus.nextSection === 'user' ? 'Your task' : 'Agent'}{' '}
                  {focus.nextJobIndex + 1}/{allPhaseJobs(focus.phase).length}
                </span>
              )}
            </p>
            {focus.nextJob ? (
              <p className="mt-1 text-xs text-[#d1d5db]">
                {focus.nextSection === 'user' ? 'You: ' : 'Agent: '}
                {focus.nextJob.label}
              </p>
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
            All execution phases complete. Click <span className="font-medium">Export</span> to
            download the handoff bundle for external agents.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-auto p-3 pb-4">
        {!hasPlan && !isBootstrapping && !error && planStale && (
          <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-4 text-center text-xs text-amber-100/90">
            Stored plan uses the older v1 format. Click{' '}
            <span className="font-medium text-amber-50">Regenerate</span> for human-gate phases (v2).
          </p>
        )}

        {!hasPlan && !isBootstrapping && !planStale && (
          <p className="rounded-xl border border-white/10 bg-[#141824]/60 px-3 py-4 text-center text-xs text-[#9aa3b2]">
            Define intent in your spec, then click{' '}
            <span className="font-medium text-[#e5e7eb]">Regenerate</span> to build human-gate
            execution phases from your spec.
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
