import { useCallback, useEffect, useState } from 'react'
import { createProject, fetchProjects, type ProjectSummary } from '../../lib/api'
import { syncCanvasToLocalProjects } from './CanvasProjectLoader'
import { useAppStore } from '../../store/appStore'
import ProjectTile from './ProjectTile'

export default function ProjectGalleryPage() {
  const galleryRefreshKey = useAppStore((state) => state.galleryRefreshKey)
  const openProject = useAppStore((state) => state.openProject)
  const openNewProject = useAppStore((state) => state.openNewProject)

  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      syncCanvasToLocalProjects()
      const list = await fetchProjects()
      setProjects(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [galleryRefreshKey, loadProjects])

  const handleCreate = async () => {
    if (isCreating) return

    setIsCreating(true)
    setError(null)
    try {
      const project = await createProject()
      openNewProject(project.projectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRenamed = (projectId: string, name: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId ? { ...project, projectName: name } : project,
      ),
    )
  }

  const handleDeleted = (projectId: string) => {
    setProjects((current) => current.filter((project) => project.projectId !== projectId))
  }

  return (
    <div className="project-gallery">
      <header className="project-gallery__header">
        <button
          type="button"
          className="project-gallery__create-btn"
          onClick={() => void handleCreate()}
          disabled={isCreating}
        >
          {isCreating ? 'Creating…' : 'Create new'}
        </button>
      </header>

      {error && <p className="project-gallery__error">{error}</p>}

      {isLoading ? (
        <p className="project-gallery__status">Loading projects…</p>
      ) : (
        <div className="project-gallery__grid">
          {projects.map((project) => (
            <ProjectTile
              key={project.projectId}
              project={project}
              onOpen={openProject}
              onRenamed={handleRenamed}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
