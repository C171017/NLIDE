export interface RouterContextCard {
  id: string
  type: string
  title: string
  body: string
  specRef?: { file: string; anchor?: string }
  status?: string
}

export interface RouterContextEdge {
  source: string
  target: string
  label?: string
}

export interface RouterContext {
  projectName?: string
  centerCardId: string
  cards: RouterContextCard[]
  edges: RouterContextEdge[]
}

export interface RouteIntentInput {
  message: string
  context: RouterContext
}

export type RouteIntentErrorCode =
  | 'router_unconfigured'
  | 'router_invalid_json'
  | 'router_validation_failed'
  | 'router_upstream_error'

export type RouteIntentResult =
  | { ok: true; plan: import('../_shared/translator/types.ts').RouterPlan; model: string }
  | {
      ok: false
      error: {
        code: RouteIntentErrorCode
        message: string
        zodIssues?: Array<{ path: string; message: string }>
      }
    }
