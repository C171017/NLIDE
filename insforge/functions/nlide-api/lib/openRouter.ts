const DEFAULT_MODEL = 'anthropic/claude-sonnet-4'

export function getOpenRouterConfig(): { apiKey: string; model: string } | null {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) return null
  return {
    apiKey,
    model: Deno.env.get('OPENROUTER_CHAT_MODEL') ?? DEFAULT_MODEL,
  }
}

export function isLlmConfigured(): boolean {
  return Boolean(getOpenRouterConfig())
}

export interface OpenRouterChatOptions {
  systemPrompt: string
  userContent: string
  title: string
  jsonMode?: boolean
  maxTokens?: number
}

/** Call OpenRouter chat completions. */
export async function callOpenRouterChat(
  options: OpenRouterChatOptions,
): Promise<{ content: string; model: string }> {
  const config = getOpenRouterConfig()
  if (!config) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const body: Record<string, unknown> = {
    model: config.model,
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
      Authorization: `Bearer ${config.apiKey}`,
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

  return { content, model: payload.model ?? config.model }
}
