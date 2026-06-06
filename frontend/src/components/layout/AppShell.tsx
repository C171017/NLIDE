import ChatBar from '../chat/ChatBar'
import IntentCanvas from '../canvas/IntentCanvas'
import Header from './Header'
import SidePanel from './SidePanel'

export default function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-[#0f1117]">
      <Header />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <IntentCanvas />
        </main>
        <SidePanel />
      </div>
      <ChatBar />
    </div>
  )
}
