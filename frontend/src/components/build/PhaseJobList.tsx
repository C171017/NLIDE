import clsx from 'clsx'
import type { BuildPhase } from '@nlide/shared'
import { phaseProgress, progressBarSegments } from '../../lib/buildPhaseUtils'
import { useImplementationProgressStore } from '../../store/implementationProgressStore'
import JobCheckbox from './JobCheckbox'

interface PhaseJobListProps {
  phase: BuildPhase
  defaultExpanded?: boolean
  currentChecklistId?: string
  currentJobId?: string
}

export default function PhaseJobList({
  phase,
  defaultExpanded = false,
  currentChecklistId,
  currentJobId,
}: PhaseJobListProps) {
  const toggleItem = useImplementationProgressStore((state) => state.toggleItem)
  const isItemDone = useImplementationProgressStore((state) => state.isItemDone)
  const countDone = useImplementationProgressStore((state) => state.countDone)

  const { done, total, ready } = phaseProgress(phase, countDone)
  const fraction = total > 0 ? done / total : 0
  const isCurrentPhase = phase.checklistId === currentChecklistId

  return (
    <details
      className={clsx(
        'group rounded-xl border bg-[#141824]/80',
        isCurrentPhase ? 'border-sky-400/40' : 'border-white/10',
      )}
      open={defaultExpanded || isCurrentPhase || phase.status === 'active'}
    >
      <summary
        className="nodrag nopan nowheel cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#f3f4f6]">{phase.title}</span>
              <PhaseStatusBadge status={phase.status} ready={ready} isCurrent={isCurrentPhase} />
            </div>
            <p className="text-[11px] leading-snug text-[#9aa3b2]">{phase.plainSummary}</p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-[#9aa3b2]">
            {done}/{total}
          </span>
        </div>
        <div
          className={clsx(
            'mt-2 font-mono text-[10px] leading-none',
            ready ? 'text-emerald-400' : isCurrentPhase ? 'text-sky-400' : 'text-[#6b7280]',
          )}
        >
          [{progressBarSegments(fraction)}]
        </div>
      </summary>

      <div
        className="nodrag nopan nowheel border-t border-white/10 px-3 py-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ul className="space-y-1">
          {phase.jobs.map((job, index) => {
            const checked = isItemDone(phase.checklistId, job.id)
            const highlighted =
              isCurrentPhase && !ready && job.id === currentJobId && !checked

            return (
              <li key={job.id}>
                <JobCheckbox
                  checked={checked}
                  onToggle={() => toggleItem(phase.checklistId, job.id)}
                  highlighted={highlighted}
                  label={
                    <>
                      {index + 1}. {job.label}
                    </>
                  }
                  detail={
                    job.detail ? (
                      <span className="mt-0.5 block text-[10px] leading-snug text-[#6b7280]">
                        {job.detail}
                      </span>
                    ) : undefined
                  }
                />
              </li>
            )
          })}
        </ul>

        {ready && (
          <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] leading-snug text-emerald-200">
            Ready for Agent mode — {phase.agentModeGoal}
          </p>
        )}
      </div>
    </details>
  )
}

function PhaseStatusBadge({
  status,
  ready,
  isCurrent,
}: {
  status: BuildPhase['status']
  ready: boolean
  isCurrent: boolean
}) {
  if (ready) {
    return (
      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
        ready
      </span>
    )
  }

  if (isCurrent) {
    return (
      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300">
        you are here
      </span>
    )
  }

  if (status === 'done') {
    return (
      <span className="rounded-full bg-[#374151] px-2 py-0.5 text-[10px] text-[#d1d5db]">done</span>
    )
  }

  return (
    <span className="rounded-full bg-[#1a1d27] px-2 py-0.5 text-[10px] text-[#6b7280]">upcoming</span>
  )
}
