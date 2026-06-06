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

export async function deleteEdgeRemote(
  edgeId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<void> {
  if (!functionUrl) return

  await post({ action: 'delete-edge', edgeId, projectId })
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

export type ExecutionPlanState = import('@nlide/shared').ExecutionPlanState

export async function fetchExecutionPlan(
  projectId = DEFAULT_PROJECT_ID,
): Promise<ExecutionPlanState> {
  if (!functionUrl) {
    return { committed: null, preview: null }
  }

  return post<ExecutionPlanState>({
    action: 'get-execution-plan',
    projectId,
  })
}

export interface RegenerateExecutionPlanResult {
  previewId: string
  plan: import('@nlide/shared').ExecutionPlan
  model: string
  specSource: 'postgres' | 'client'
}

export async function regenerateExecutionPlan(
  context: {
    specBundle: Record<string, string>
    cardSynthesis: import('@nlide/shared').CardSynthesisBundle
    projectName?: string
  },
  projectId = DEFAULT_PROJECT_ID,
): Promise<RegenerateExecutionPlanResult> {
  if (!functionUrl) {
    throw new Error('VITE_INSFORGE_FUNCTION_URL is not set')
  }

  const data = await post<{
    ok: boolean
    previewId: string
    plan: import('@nlide/shared').ExecutionPlan
    model: string
    specSource: 'postgres' | 'client'
    error?: { message?: string }
  }>({
    action: 'plan-execution',
    projectId,
    specBundle: context.specBundle,
    cardSynthesis: context.cardSynthesis,
    projectName: context.projectName,
  })

  if (!data.ok) {
    throw new Error(data.error?.message ?? 'Failed to regenerate execution plan')
  }

  return {
    previewId: data.previewId,
    plan: data.plan,
    model: data.model,
    specSource: data.specSource,
  }
}

export async function commitExecutionPlanRemote(
  previewId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<import('@nlide/shared').ExecutionPlan> {
  if (!functionUrl) {
    throw new Error('VITE_INSFORGE_FUNCTION_URL is not set')
  }

  const data = await post<{ committed: boolean; plan: import('@nlide/shared').ExecutionPlan }>({
    action: 'commit-execution-plan',
    previewId,
    projectId,
  })

  return data.plan
}

export async function discardExecutionPlanRemote(
  previewId: string,
  projectId = DEFAULT_PROJECT_ID,
): Promise<void> {
  if (!functionUrl) {
    throw new Error('VITE_INSFORGE_FUNCTION_URL is not set')
  }

  await post({ action: 'discard-execution-plan', previewId, projectId })
}
