import { useAppStore } from './store/appStore'
import AppShell from './components/layout/AppShell'
import ProjectGalleryPage from './components/projects/ProjectGalleryPage'

export default function App() {
  const view = useAppStore((state) => state.view)

  if (view === 'gallery') {
    return <ProjectGalleryPage />
  }

  return <AppShell />
}
