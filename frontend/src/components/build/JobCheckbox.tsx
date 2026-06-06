import clsx from 'clsx'
import type { MouseEvent, ReactNode } from 'react'

interface JobCheckboxProps {
  checked: boolean
  onToggle: () => void
  label: ReactNode
  detail?: ReactNode
  highlighted?: boolean
}

function stopBubble(event: MouseEvent) {
  event.stopPropagation()
}

export default function JobCheckbox({
  checked,
  onToggle,
  label,
  detail,
  highlighted = false,
}: JobCheckboxProps) {
  const handleToggle = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onToggle()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle()
        }
      }}
      className={clsx(
        'nodrag nopan nowheel flex w-full cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-[#1a1d27]',
        highlighted && 'bg-sky-500/10 ring-1 ring-sky-400/50',
      )}
      onPointerDown={stopBubble}
      onMouseDown={stopBubble}
    >
      <span
        aria-hidden
        className={clsx(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
          checked
            ? 'border-sky-400 bg-sky-500 text-white'
            : 'border-[#6b7280] bg-[#0f1117] text-transparent',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1 select-none">
        <span
          className={clsx(
            'block text-xs leading-snug',
            checked ? 'text-[#9aa3b2] line-through' : 'text-[#e8eaed]',
          )}
        >
          {label}
        </span>
        {detail}
      </span>
    </div>
  )
}
