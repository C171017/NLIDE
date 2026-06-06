import { useEffect, useState } from 'react'
import { assembleSpecFileFromCards } from '../lib/assembleSpecFromCards'
import { fetchSpecFileRemote } from '../lib/api'
import { getLocalSpecFile } from '../lib/localSpecFiles'
import type { Card } from '../types/canvas'

export function useSpecFileContent(file: string, cards: Card[], projectName: string) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      const assembled = assembleSpecFileFromCards(file, cards, projectName)
      const remote = await fetchSpecFileRemote(file).catch(() => null)
      const local = getLocalSpecFile(file)

      if (cancelled) return

      setContent(
        remote?.content?.trim()
          ? remote.content
          : assembled.trim()
            ? assembled
            : (local ?? assembled),
      )
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [file, cards, projectName])

  return { content, isLoading }
}
