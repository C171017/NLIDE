import { useEffect } from 'react'
import { DEFAULT_PROJECT_ID, fetchProject, isInsForgeConfigured } from '../../lib/api'
import { loadSpecCanvas, loadSpecProjectName } from '../../lib/loadSpecCanvas'
import { syncLocalProjectCanvas } from '../../lib/localProjects'
import { useAppStore } from '../../store/appStore'
import { useCanvasStore } from '../../store/canvasStore'

export default function CanvasProjectLoader({ children }: { children: React.ReactNode }) {
  const activeProjectId = useAppStore((state) => state.activeProjectId)
  const loadProject = useCanvasStore((state) => state.loadProject)

  useEffect(() => {
    if (!activeProjectId) return

    let cancelled = false

    void (async () => {
      try {
        const payload = await fetchProject(activeProjectId)
        if (cancelled) return

        if (
          payload.projectId === DEFAULT_PROJECT_ID &&
          payload.cards.length === 0 &&
          isInsForgeConfigured()
        ) {
          const spec = loadSpecCanvas()
          loadProject({
            ...payload,
            projectName: loadSpecProjectName(),
            centerCardId: spec.centerCardId,
            cards: spec.cards,
            edges: spec.edges,
          })
          return
        }

        loadProject(payload)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeProjectId, loadProject])

  useEffect(() => {
    return () => {
      const state = useCanvasStore.getState()
      if (state.projectId) {
        syncLocalProjectCanvas(state.projectId, {
          projectName: state.projectName,
          centerCardId: state.centerCardId,
          cards: state.committedCards,
          edges: state.committedEdges,
        })
      }
    }
  }, [activeProjectId])

  return children
}

export function syncCanvasToLocalProjects() {
  const state = useCanvasStore.getState()
  if (!state.projectId) return

  syncLocalProjectCanvas(state.projectId, {
    projectName: state.projectName,
    centerCardId: state.centerCardId,
    cards: state.committedCards,
    edges: state.committedEdges,
  })
}
