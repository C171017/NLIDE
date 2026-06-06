import { useEffect, useState } from 'react'
import ChatBar from '../chat/ChatBar'
import IntentCanvas from '../canvas/IntentCanvas'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useResizableSize } from '../../hooks/useResizableSize'
import ResizeHandle from './ResizeHandle'
import SidePanel from './SidePanel'

const SIDE_PANEL_WIDTH_KEY = 'nlide.layout.sidePanelWidth'
const SIDE_PANEL_HEIGHT_KEY = 'nlide.layout.sidePanelHeight'
const CHAT_BAR_HEIGHT_KEY = 'nlide.layout.chatBarHeight'

function readWindowSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState(readWindowSize)

  useEffect(() => {
    const onResize = () => setWindowSize(readWindowSize())

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return windowSize
}

export default function AppShell() {
  const isLarge = useMediaQuery('(min-width: 1024px)')
  const windowSize = useWindowSize()

  const sidePanelWidthMax = Math.max(260, Math.min(640, windowSize.width - 460))
  const sidePanelHeightMax = Math.max(140, Math.min(360, Math.floor(windowSize.height * 0.34)))
  const chatBarHeightMax = Math.max(108, Math.min(320, Math.floor(windowSize.height * 0.3)))

  const sidePanelWidth = useResizableSize({
    storageKey: SIDE_PANEL_WIDTH_KEY,
    defaultSize: 384,
    min: 260,
    max: sidePanelWidthMax,
  })

  const sidePanelHeight = useResizableSize({
    storageKey: SIDE_PANEL_HEIGHT_KEY,
    defaultSize: 200,
    min: 140,
    max: sidePanelHeightMax,
  })

  const chatBarHeight = useResizableSize({
    storageKey: CHAT_BAR_HEIGHT_KEY,
    defaultSize: 148,
    min: 108,
    max: chatBarHeightMax,
  })

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f1117] p-3">
      <div
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ minHeight: 0 }}
      >
        <main
          className="glass-panel min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl"
          style={isLarge ? undefined : { minHeight: 120 }}
        >
          <IntentCanvas />
        </main>

        <ResizeHandle
          direction={isLarge ? 'horizontal' : 'vertical'}
          label={isLarge ? 'Resize side panel width' : 'Resize side panel height'}
          onResize={(delta) => {
            if (isLarge) {
              sidePanelWidth.applyDelta(-delta)
            } else {
              sidePanelHeight.applyDelta(-delta)
            }
          }}
        />

        <SidePanel
          style={
            isLarge
              ? { width: sidePanelWidth.size, flexShrink: 0 }
              : { height: sidePanelHeight.size, flexShrink: 0 }
          }
        />
      </div>

      <ResizeHandle
        direction="vertical"
        label="Resize chat bar height"
        onResize={(delta) => chatBarHeight.applyDelta(-delta)}
      />

      <ChatBar style={{ height: chatBarHeight.size, flexShrink: 0 }} />
    </div>
  )
}
