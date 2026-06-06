import { formatRouterPromptOutline } from '../../../../shared/translator/routerPromptOutline.ts'
import { parseRouterPlanFromLlmText } from './schema.ts'
import type { RouteIntentInput, RouteIntentResult } from './types.ts'

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4'

function getOpenRouterConfig(): { apiKey: string; model: string } | null {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) return null
  return {
    apiKey,
    model: Deno.env.get('OPENROUTER_CHAT_MODEL') ?? DEFAULT_MODEL,
  }
}

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

async function callOpenRouter(
  systemPrompt: string,
  userPayload: string,
): Promise<{ content: string; model: string }> {
  const config = getOpenRouterConfig()
  if (!config) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nlide.dev',
      'X-Title': 'NLIDE Router',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            'Classify the user_message using context. Return ONLY valid JSON matching the output contract.\n\n' +
            userPayload,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 300)}`)
  }

  const payload = (await response.json()) as {
    model?: string
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned empty completion')
  }

  return { content, model: payload.model ?? config.model }
}

/** Route one NLIDE chat message → validated RouterPlan JSON. Phase 2 implementation. */
export async function routeIntent(input: RouteIntentInput): Promise<RouteIntentResult> {
  if (!getOpenRouterConfig()) {
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
    llm = await callOpenRouter(systemPrompt, buildUserPayload(input))
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
  return Boolean(getOpenRouterConfig())
}
