/** Per-role defaults: fast Haiku for JSON routing; Sonnet for prose + planning. */
export type LlmRole = 'router' | 'writer' | 'planner'

const ROLE_MODEL_DEFAULTS: Record<LlmRole, string> = {
  router: 'anthropic/claude-haiku-4.5',
  writer: 'anthropic/claude-sonnet-4',
  planner: 'anthropic/claude-sonnet-4',
}

const ROLE_ENV_KEYS: Record<LlmRole, string> = {
  router: 'OPENROUTER_ROUTER_MODEL',
  writer: 'OPENROUTER_WRITER_MODEL',
  planner: 'OPENROUTER_PLANNER_MODEL',
}

export function getOpenRouterApiKey(): string | null {
  return Deno.env.get('OPENROUTER_API_KEY') ?? null
}

/** Resolve model for a translator role; OPENROUTER_CHAT_MODEL overrides all roles when set. */
export function resolveModelForRole(role: LlmRole): string {
  const globalOverride = Deno.env.get('OPENROUTER_CHAT_MODEL')
  if (globalOverride) return globalOverride
  return Deno.env.get(ROLE_ENV_KEYS[role]) ?? ROLE_MODEL_DEFAULTS[role]
}

export function getOpenRouterConfig(): { apiKey: string; model: string } | null {
  const apiKey = getOpenRouterApiKey()
  if (!apiKey) return null
  return {
    apiKey,
    model: resolveModelForRole('writer'),
  }
}

export function isLlmConfigured(): boolean {
  return Boolean(getOpenRouterApiKey())
}

export interface OpenRouterChatOptions {
  systemPrompt: string
  userContent: string
  title: string
  jsonMode?: boolean
  maxTokens?: number
  /** Pick role-specific model when `model` is not set. */
  role?: LlmRole
  /** Explicit model override (wins over role). */
  model?: string
}

/** Call OpenRouter chat completions. */
export async function callOpenRouterChat(
  options: OpenRouterChatOptions,
): Promise<{ content: string; model: string }> {
  const apiKey = getOpenRouterApiKey()
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const model = options.model ?? resolveModelForRole(options.role ?? 'writer')

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userContent },
    ],
    max_tokens: options.maxTokens ?? 1200,
    temperature: 0,
  }

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nlide.dev',
      'X-Title': options.title,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 300)}`)
  }

  const payload = (await response.json()) as {
    model?: string
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned empty completion')
  }

  return { content, model: payload.model ?? model }
}
