import clsx from 'clsx'
import { forwardRef } from 'react'

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

interface DeleteModeTrashProps {
  isHovered: boolean
}

const DeleteModeTrash = forwardRef<HTMLDivElement, DeleteModeTrashProps>(function DeleteModeTrash(
  { isHovered },
  ref,
) {
  return (
    <div className="canvas-delete-trash">
      <div
        ref={ref}
        className={clsx(
          'canvas-nav-panel__trash-zone',
          isHovered && 'canvas-nav-panel__trash-zone--active',
        )}
        aria-label="Drop a card here to delete"
      >
        <TrashIcon />
      </div>
    </div>
  )
})

export default DeleteModeTrash
