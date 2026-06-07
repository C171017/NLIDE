import { useCallback, useState, type MouseEvent } from 'react'
import type { ProjectSummary } from '../../lib/api'
import { deleteProject, updateProjectName } from '../../lib/api'
import ProjectCanvasPreview from './ProjectCanvasPreview'
import ProjectDeleteConfirmDialog from './ProjectDeleteConfirmDialog'

interface ProjectTileProps {
  project: ProjectSummary
  onOpen: (projectId: string) => void
  onRenamed: (projectId: string, name: string) => void
  onDeleted: (projectId: string) => void
}

export default function ProjectTile({ project, onOpen, onRenamed, onDeleted }: ProjectTileProps) {
  const [name, setName] = useState(project.projectName)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const saveName = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === project.projectName) {
      setName(project.projectName)
      return
    }

    setIsSaving(true)
    try {
      await updateProjectName(project.projectId, trimmed)
      onRenamed(project.projectId, trimmed)
    } catch (error) {
      console.error('Failed to rename project:', error)
      setName(project.projectName)
    } finally {
      setIsSaving(false)
    }
  }, [name, onRenamed, project.projectId, project.projectName])

  const handleDeleteClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDeleteError(null)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteProject(project.projectId)
      setConfirmOpen(false)
      onDeleted(project.projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className="project-tile">
      <div className="project-tile__preview-wrap">
        <button
          type="button"
          className="project-tile__preview-btn"
          onClick={() => onOpen(project.projectId)}
          aria-label={`Open ${project.projectName}`}
        >
          <ProjectCanvasPreview cards={project.cards} edges={project.edges} />
        </button>
        <button
          type="button"
          className="project-tile__delete-btn"
          onClick={handleDeleteClick}
          aria-label={`Delete ${project.projectName}`}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" className="project-tile__delete-icon">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
      <div className="project-tile__title-row">
        <input
          type="text"
          className="project-tile__title-input"
          value={name}
          disabled={isSaving}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void saveName()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          onClick={(event) => event.stopPropagation()}
          aria-label="Project name"
        />
        {deleteError && <p className="project-tile__delete-error">{deleteError}</p>}
      </div>
      {confirmOpen && (
        <ProjectDeleteConfirmDialog
          projectName={name.trim() || project.projectName}
          isDeleting={isDeleting}
          onCancel={() => {
            if (isDeleting) return
            setConfirmOpen(false)
            setDeleteError(null)
          }}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </article>
  )
}
