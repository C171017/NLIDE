import { useCallback, useState } from 'react'
import type { ProjectSummary } from '../../lib/api'
import { updateProjectName } from '../../lib/api'
import ProjectCanvasPreview from './ProjectCanvasPreview'

interface ProjectTileProps {
  project: ProjectSummary
  onOpen: (projectId: string) => void
  onRenamed: (projectId: string, name: string) => void
}

export default function ProjectTile({ project, onOpen, onRenamed }: ProjectTileProps) {
  const [name, setName] = useState(project.projectName)
  const [isSaving, setIsSaving] = useState(false)

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

  return (
    <article className="project-tile">
      <button
        type="button"
        className="project-tile__preview-btn"
        onClick={() => onOpen(project.projectId)}
        aria-label={`Open ${project.projectName}`}
      >
        <ProjectCanvasPreview cards={project.cards} edges={project.edges} />
      </button>
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
      </div>
    </article>
  )
}
