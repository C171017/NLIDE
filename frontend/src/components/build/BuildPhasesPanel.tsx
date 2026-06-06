import { useMemo } from 'react'
import { useTranslatorSpec } from '../../hooks/useTranslatorSpec'
import { phaseProgress, progressBarSegments, resolveBuildFocus } from '../../lib/buildPhaseUtils'
import {
  countDone,
  isItemDone,
  useImplementationProgressStore,
} from '../../store/implementationProgressStore'
import PhaseJobList from './PhaseJobList'

export default function BuildPhasesPanel() {
  const { phases, source } = useTranslatorSpec()
  const completed = useImplementationProgressStore((state) => state.completed)

  const focus = useMemo(
    () =>
      resolveBuildFocus(
        phases,
        (checklistId, itemId) => isItemDone(completed, checklistId, itemId),
        (checklistId, itemIds) => countDone(completed, checklistId, itemIds),
      ),
    [phases, completed],
  )

  const activeProgress = focus
    ? phaseProgress(focus.phase, (checklistId, itemIds) =>
        countDone(completed, checklistId, itemIds),
      )
    : { done: 0, total: 0, ready: false }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#f3f4f6]">Translator build plan</h2>
        <p className="text-xs text-[#9aa3b2]">
          Tick jobs as you approve each instruction. Finish a phase → Agent mode.
        </p>

        {focus && !focus.allPhasesReady && (
          <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
              You are here
            </p>
            <p className="mt-1 text-sm font-medium text-[#f3f4f6]">
              {focus.phase.title}
              {!focus.phaseReady && focus.nextJobIndex >= 0 && (
                <span className="text-sky-200">
                  {' '}
                  · Job {focus.nextJobIndex + 1}/{focus.phase.jobs.length}
                </span>
              )}
            </p>
            {focus.nextJob ? (
              <p className="mt-1 text-xs text-[#d1d5db]">{focus.nextJob.label}</p>
            ) : (
              <p className="mt-1 text-xs text-emerald-200">Phase complete — switch to Agent mode.</p>
            )}
            <p className="mt-2 font-mono text-[10px] text-sky-300/90">
              [{progressBarSegments(activeProgress.total > 0 ? activeProgress.done / activeProgress.total : 0)}]{' '}
              {activeProgress.done}/{activeProgress.total}
            </p>
          </div>
        )}

        {focus?.allPhasesReady && (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            All instruction phases complete. Ready for full Agent-mode translator rollout.
          </p>
        )}

        <p className="mt-2 text-[10px] text-[#6b7280]">Spec source: {source}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-auto p-3">
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
