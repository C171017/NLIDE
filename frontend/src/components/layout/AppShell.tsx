import ChatBar from '../chat/ChatBar'
import IntentCanvas from '../canvas/IntentCanvas'
import SidePanel from './SidePanel'

export default function AppShell() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-[#0f1117] p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <main className="glass-panel min-h-[25vh] min-w-0 flex-1 overflow-hidden rounded-3xl lg:min-h-0">
          <IntentCanvas />
        </main>
        <SidePanel />
      </div>
      <ChatBar />
    </div>
  )
}
