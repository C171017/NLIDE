import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ProjectDeleteConfirmDialogProps {
  projectName: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ProjectDeleteConfirmDialog({
  projectName,
  isDeleting,
  onCancel,
  onConfirm,
}: ProjectDeleteConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDeleting, onCancel])

  return createPortal(
    <div className="project-delete-dialog" role="presentation">
      <button
        type="button"
        className="project-delete-dialog__backdrop"
        aria-label="Close dialog"
        disabled={isDeleting}
        onClick={onCancel}
      />
      <div
        className="project-delete-dialog__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="project-delete-dialog__title">
          Delete project?
        </h2>
        <p className="project-delete-dialog__message">
          <strong>{projectName}</strong> will be permanently removed. This cannot be undone.
        </p>
        <div className="project-delete-dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="project-delete-dialog__btn project-delete-dialog__btn--cancel"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="project-delete-dialog__btn project-delete-dialog__btn--delete"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? 'Deleting…' : 'Delete project'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
