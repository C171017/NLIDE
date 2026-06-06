import { useCallback, useEffect, useState } from 'react'

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

function getFullscreenElement() {
  const doc = document as FullscreenDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function requestAppFullscreen() {
  const el = document.documentElement as FullscreenElement

  if (el.requestFullscreen) {
    await el.requestFullscreen()
    return
  }

  await el.webkitRequestFullscreen?.()
}

async function exitAppFullscreen() {
  const doc = document as FullscreenDocument

  if (doc.exitFullscreen) {
    await doc.exitFullscreen()
    return
  }

  await doc.webkitExitFullscreen?.()
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(getFullscreenElement()))

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(getFullscreenElement()))

    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)

    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (getFullscreenElement()) {
        await exitAppFullscreen()
      } else {
        await requestAppFullscreen()
      }
    } catch {
      // Browser blocked the request (e.g. not from a user gesture).
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
