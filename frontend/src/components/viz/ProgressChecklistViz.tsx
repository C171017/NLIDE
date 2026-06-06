import clsx from 'clsx'
import type { ProgressChecklistPayload } from '../../types/canvas'
import {
  countDone,
  isItemDone,
  useImplementationProgressStore,
} from '../../store/implementationProgressStore'
import { progressBarSegments } from '../../lib/buildPhaseUtils'
import JobCheckbox from '../build/JobCheckbox'

interface ProgressChecklistVizProps {
  data: ProgressChecklistPayload
  compact?: boolean
  currentJobId?: string
}

export default function ProgressChecklistViz({
  data,
  compact = false,
  currentJobId,
}: ProgressChecklistVizProps) {
  const completed = useImplementationProgressStore((state) => state.completed)
  const toggleItem = useImplementationProgressStore((state) => state.toggleItem)

  const itemIds = data.items.map((item) => item.id)
  const done = countDone(completed, data.checklistId, itemIds)
  const total = data.items.length
  const fraction = total > 0 ? done / total : 0
  const ready = done === total
  const nextJobId =
    currentJobId ?? itemIds.find((id) => !isItemDone(completed, data.checklistId, id))

  return (
    <div
      className={clsx(
        'nodrag nopan nowheel rounded-lg border border-[#2d3348] bg-[#141824]',
        compact ? 'p-2' : 'p-3',
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9aa3b2]">
        {data.phaseLabel}
      </div>

      <div
        className={clsx(
          'mb-1 font-mono text-xs leading-none',
          ready ? 'text-emerald-400' : 'text-sky-400',
        )}
      >
        [{progressBarSegments(fraction)}]
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={clsx(
            'text-sm font-semibold tabular-nums',
            ready ? 'text-emerald-300' : 'text-[#f3f4f6]',
          )}
        >
          {done}/{total}
        </span>
        <span className={clsx('text-xs', ready ? 'text-emerald-400/90' : 'text-[#9aa3b2]')}>
          {ready ? data.readyLabel : data.blockedLabel}
        </span>
      </div>

      <ul className={clsx('space-y-1', compact && 'max-h-44 overflow-y-auto')}>
        {data.items.map((item, index) => {
          const checked = isItemDone(completed, data.checklistId, item.id)
          const highlighted = !ready && item.id === nextJobId && !checked

          return (
            <li key={item.id}>
              <JobCheckbox
                checked={checked}
                onToggle={() => toggleItem(data.checklistId, item.id)}
                highlighted={highlighted}
                label={
                  <>
                    {index + 1}. {item.label}
                  </>
                }
                detail={
                  item.detail && !compact ? (
                    <span className="mt-0.5 block text-[10px] leading-snug text-[#6b7280]">
                      {item.detail}
                    </span>
                  ) : undefined
                }
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
