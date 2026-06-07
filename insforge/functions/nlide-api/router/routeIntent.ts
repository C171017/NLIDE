import { formatRouterPromptOutline } from '../_shared/translator/routerPromptOutline.ts'
import { callOpenRouterChat, getOpenRouterApiKey, isLlmConfigured } from '../lib/openRouter.ts'
import { parseRouterPlanFromLlmText } from './schema.ts'
import type { RouteIntentInput, RouteIntentResult } from './types.ts'

function buildUserPayload(input: RouteIntentInput): string {
  return JSON.stringify(
    {
      user_message: input.message,
      context: input.context,
    },
    null,
    2,
  )
}

/** Route one NLIDE chat message → validated RouterPlan JSON. Phase 2 implementation. */
export async function routeIntent(input: RouteIntentInput): Promise<RouteIntentResult> {
  if (!getOpenRouterApiKey()) {
    return {
      ok: false,
      error: {
        code: 'router_unconfigured',
        message: 'OPENROUTER_API_KEY is not set on nlide-api function secrets',
      },
    }
  }

  const systemPrompt = formatRouterPromptOutline()

  let llm: { content: string; model: string }
  try {
    llm = await callOpenRouterChat({
      systemPrompt,
      userContent:
        'Classify the user_message using context. Return ONLY valid JSON matching the output contract.\n\n' +
        buildUserPayload(input),
      title: 'NLIDE Router',
      role: 'router',
      jsonMode: true,
      maxTokens: 1200,
    })
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'router_upstream_error',
        message: error instanceof Error ? error.message : 'Router LLM call failed',
      },
    }
  }

  const parsed = parseRouterPlanFromLlmText(llm.content)
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: parsed.code,
        message: parsed.message,
        zodIssues: parsed.code === 'router_validation_failed' ? parsed.zodIssues : undefined,
      },
    }
  }

  return { ok: true, plan: parsed.plan, model: llm.model }
}

export function isRouterConfigured(): boolean {
  return isLlmConfigured()
}
