import clsx from 'clsx'
import type { ProgressChecklistPayload } from '../../types/canvas'
import { useImplementationProgressStore } from '../../store/implementationProgressStore'

interface ProgressChecklistVizProps {
  data: ProgressChecklistPayload
  compact?: boolean
}

const BAR_SEGMENTS = 10

function progressBar(fraction: number) {
  const filled = Math.round(fraction * BAR_SEGMENTS)
  return '█'.repeat(filled) + '░'.repeat(BAR_SEGMENTS - filled)
}

export default function ProgressChecklistViz({ data, compact = false }: ProgressChecklistVizProps) {
  const toggleItem = useImplementationProgressStore((state) => state.toggleItem)
  const isItemDone = useImplementationProgressStore((state) => state.isItemDone)
  const countDone = useImplementationProgressStore((state) => state.countDone)

  const itemIds = data.items.map((item) => item.id)
  const done = countDone(data.checklistId, itemIds)
  const total = data.items.length
  const fraction = total > 0 ? done / total : 0
  const ready = done === total

  return (
    <div
      className={clsx('nodrag nowheel rounded-lg border border-[#2d3348] bg-[#141824]', compact ? 'p-2' : 'p-3')}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9aa3b2]">
        {data.phaseLabel}
      </div>

      <div
        className={clsx(
          'mb-1 font-mono text-xs leading-none',
          ready ? 'text-emerald-400' : 'text-sky-400',
        )}
        aria-hidden
      >
        [{progressBar(fraction)}]
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={clsx('text-sm font-semibold tabular-nums', ready ? 'text-emerald-300' : 'text-[#f3f4f6]')}>
          {done}/{total}
        </span>
        <span className={clsx('text-xs', ready ? 'text-emerald-400/90' : 'text-[#9aa3b2]')}>
          {ready ? data.readyLabel : data.blockedLabel}
        </span>
      </div>

      <ul className={clsx('space-y-1.5', compact && 'max-h-40 overflow-y-auto')}>
        {data.items.map((item, index) => {
          const checked = isItemDone(data.checklistId, item.id)
          return (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-0.5 hover:bg-[#1a1d27]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(data.checklistId, item.id)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#2d3348] bg-[#0f1117] text-sky-500 focus:ring-sky-500/40"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={clsx(
                      'block text-xs leading-snug',
                      checked ? 'text-[#9aa3b2] line-through' : 'text-[#e8eaed]',
                    )}
                  >
                    {index + 1}. {item.label}
                  </span>
                  {item.detail && !compact && (
                    <span className="mt-0.5 block text-[10px] leading-snug text-[#6b7280]">{item.detail}</span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
