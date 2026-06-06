import { useEffect, useMemo, useState } from 'react'
import { assembleSpecFileFromCards } from '../lib/assembleSpecFromCards'
import { fetchSpecFileRemote } from '../lib/api'
import { getLocalSpecFile } from '../lib/localSpecFiles'
import { buildEntitySectionPreview } from '../lib/specFilePreview'
import type { Card, PreviewPayload } from '../types/canvas'

export interface UseSpecFileContentInput {
  committedCards: Card[]
  preview: PreviewPayload | null
  projectName: string
  exportedSpecCache?: Record<string, string> | null
}

export function useSpecFileContent(
  file: string,
  anchor: string | undefined,
  input: UseSpecFileContentInput,
) {
  const { committedCards, preview, projectName, exportedSpecCache } = input
  const [committedFileContent, setCommittedFileContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const previewCards = preview?.cards ?? committedCards

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      const local = getLocalSpecFile(file) ?? ''
      const assembled = assembleSpecFileFromCards(file, committedCards, projectName)

      let content = ''

      if (preview) {
        content = local.trim() || assembled.trim()
      } else if (exportedSpecCache?.[file]?.trim()) {
        content = exportedSpecCache[file]
      } else {
        const remote = await fetchSpecFileRemote(file).catch(() => null)
        if (cancelled) return

        content = remote?.content?.trim()
          ? remote.content
          : local.trim()
            ? local
            : assembled.trim()
              ? assembled
              : local
      }

      if (cancelled) return

      setCommittedFileContent(content)
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [file, anchor, committedCards, preview, projectName, exportedSpecCache])

  const entityPreview = useMemo(
    () =>
      buildEntitySectionPreview(
        file,
        anchor,
        committedFileContent,
        preview,
        previewCards,
      ),
    [file, anchor, committedFileContent, preview, previewCards],
  )

  const committedSection = anchor
    ? entityPreview.committedSection
    : committedFileContent

  return {
    committedSection,
    proposedSection: entityPreview.proposedSection,
    hasPreview: entityPreview.hasPreview,
    isLoading,
  }
}
