import { create } from 'zustand'

type AppView = 'gallery' | 'canvas'

interface AppStore {
  view: AppView
  activeProjectId: string | null
  galleryRefreshKey: number
  openProject: (projectId: string) => void
  openNewProject: (projectId: string) => void
  exitToGallery: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'gallery',
  activeProjectId: null,
  galleryRefreshKey: 0,
  openProject: (projectId) => set({ view: 'canvas', activeProjectId: projectId }),
  openNewProject: (projectId) => set({ view: 'canvas', activeProjectId: projectId }),
  exitToGallery: () =>
    set((state) => ({
      view: 'gallery',
      activeProjectId: null,
      galleryRefreshKey: state.galleryRefreshKey + 1,
    })),
}))
