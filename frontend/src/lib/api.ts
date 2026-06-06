import type { CanvasEdge, Card, PreviewPayload } from '../types/canvas'
import { buildPreviewLocal } from './translatorStub'

export const DEFAULT_PROJECT_ID = '00000000-0000-4000-8000-000000000001'

const functionUrl = import.meta.env.VITE_INSFORGE_FUNCTION_URL as string | undefined

export function isInsForgeConfigured(): boolean {
  return Boolean(functionUrl?.trim())
}

async function post<T>(payload: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!functionUrl) {
    throw new Error('VITE_INSFORGE_FUNCTION_URL is not set')
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  const data = (await response.json()) as T & { error?: string | { code?: string; message?: string } }

  if (!response.ok) {
    const err = data.error
    const message =
      typeof err === 'string'
        ? err
        : err?.message ?? `API error ${response.status}`
    throw new Error(message)
  }

  return data
}

export async function checkHealth(): Promise<{ ok: boolean; mode?: string }> {
  if (!functionUrl) return { ok: true, mode: 'local-stub' }

  return post<{ ok: boolean; mode?: string }>({ action: 'health' })
}

export async function fetchTranslatorSpec(): Promise<
  import('@nlide/shared').TranslatorSpec
> {
  if (!functionUrl) {
    const { getTranslatorSpec } = await import('@nlide/shared')
    return getTranslatorSpec()
  }

  const data = await post<{ spec: import('@nlide/shared').TranslatorSpec }>({
    action: 'get-translator-spec',
  })

  return data.spec
}

export async function submitIntent(
  message: string,
  context: { cards: Card[]; edges: CanvasEdge[]; centerCardId: string },
  projectId = DEFAULT_PROJECT_ID,
  signal?: AbortSignal,
): Promise<PreviewPayload> {
  if (!functionUrl) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, 400)
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    })
    return buildPreviewLocal(message, context.cards, context.edges)
  }

  const data = await post<{ preview: PreviewPayload }>(
    {
      action: 'intent',
      projectId,
      message,
      context,
    },
    signal,
  )

  return data.preview
}

export async function commitPreviewRemote(
  previewId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<{ exportedSpec?: Record<string, string> }> {
  if (!functionUrl) return {}

  return post<{ committed: boolean; exportedSpec?: Record<string, string> }>({
    action: 'commit',
    previewId,
    projectId,
  })
}

export async function discardPreviewRemote(
  previewId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<void> {
  if (!functionUrl) return

  await post({ action: 'discard', previewId, projectId })
}

export async function patchCardRemote(
  cardId: string,
  patch: { title?: string; body?: string },
  projectId = DEFAULT_PROJECT_ID,
): Promise<void> {
  if (!functionUrl) return

  await post({ action: 'patch-card', cardId, patch, projectId })
}

export async function deleteCardRemote(
  cardId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<void> {
  if (!functionUrl) return

  await post({ action: 'delete-card', cardId, projectId })
}

export async function fetchSpecFileRemote(
  file: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<{ file: string; content: string } | null> {
  if (!functionUrl) return null

  return post<{ file: string; content: string }>({
    action: 'get-spec-file',
    file,
    projectId,
  })
}
