import { strToU8, zipSync } from 'fflate'

/** Zip handoff bundle (relative path → UTF-8 content) into a single archive. */
export function zipHandoffBundle(files: Record<string, string>): Uint8Array {
  const zipEntries: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    zipEntries[path] = strToU8(content)
  }
  return zipSync(zipEntries)
}

function suggestedZipName(exportedAt?: string): string {
  const date = (exportedAt ?? new Date().toISOString()).slice(0, 10)
  return `nlide-handoff-${date}.zip`
}

async function saveWithFilePicker(blob: Blob, suggestedName: string): Promise<boolean> {
  if (typeof window.showSaveFilePicker !== 'function') {
    return false
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'ZIP archive',
          accept: { 'application/zip': ['.zip'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return true
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return true
    }
    return false
  }
}

function saveWithAnchorDownload(blob: Blob, suggestedName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** Trigger macOS/browser Save dialog when supported; otherwise download to default folder. */
export async function downloadHandoffZip(
  files: Record<string, string>,
  exportedAt?: string,
): Promise<void> {
  const zipBytes = zipHandoffBundle(files)
  const blob = new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' })
  const name = suggestedZipName(exportedAt)

  const saved = await saveWithFilePicker(blob, name)
  if (!saved) {
    saveWithAnchorDownload(blob, name)
  }
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle>
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | BufferSource | string): Promise<void>
    close(): Promise<void>
  }
}
