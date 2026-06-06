import { createClient, type InsForgeClient } from 'npm:@insforge/sdk@latest'
import { handleGetTranslatorSpec } from './translator/index.ts'
import { runGoldenRouterTests } from './router/goldenRunner.ts'
import { isRouterConfigured, routeIntent } from './router/routeIntent.ts'
import type { RouterContext } from './router/types.ts'
import type { RouterPlan } from './_shared/translator/types.ts'
import { writeFeaturesSection, isFeaturesWriterConfigured } from './writers/featuresWriter.ts'
import { runGoldenFeaturesWriterTests } from './writers/goldenRunner.ts'

const DEFAULT_PROJECT_ID = '00000000-0000-4000-8000-000000000001'

interface SpecRef {
  file: string
  anchor?: string
}

interface Card {
  id: string
  specRef: SpecRef
  type: string
  title: string
  body: string
  position: { x: number; y: number }
  layer?: number
  parentCardId?: string
  vizType?: string
  vizPayload?: unknown
  status?: string
}

interface CanvasEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface MdPatch {
  file: string
  action: 'add' | 'update' | 'remove'
  anchor?: string
  summary: string
}

interface PreviewPayload {
  previewId: string
  cards: Card[]
  edges: CanvasEdge[]
  mdPatches: MdPatch[]
  summary: string
}

interface ApiRequest {
  action:
    | 'health'
    | 'get-project'
    | 'get-translator-spec'
    | 'route'
    | 'route-golden'
    | 'write-features'
    | 'write-features-golden'
    | 'intent'
    | 'commit'
    | 'discard'
    | 'patch-card'
  projectId?: string
  message?: string
  previewId?: string
  cardId?: string
  patch?: { title?: string; body?: string }
  context?: RouterContext
  routerPlan?: RouterPlan
  existingFeatureIds?: string[]
  existingSection?: string
}

interface ProjectPayload {
  projectId: string
  projectName: string
  centerCardId: string
  cards: Card[]
  edges: CanvasEdge[]
}

function getClient(): InsForgeClient {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL')
  const anonKey = Deno.env.get('ANON_KEY')

  if (!baseUrl || !anonKey) {
    throw new Error('Missing INSFORGE_BASE_URL or ANON_KEY function secrets')
  }

  return createClient({ baseUrl, anonKey })
}

type DbCardRow = {
  id: string
  spec_file: string
  spec_anchor: string | null
  type: string
  title: string
  body: string
  position_x: number
  position_y: number
  viz_type: string | null
  viz_payload: unknown
  status: string | null
}

type DbEdgeRow = {
  id: string
  source_id: string
  target_id: string
  label: string | null
}

function rowToCard(row: DbCardRow): Card {
  return {
    id: row.id,
    specRef: { file: row.spec_file, anchor: row.spec_anchor ?? undefined },
    type: row.type,
    title: row.title,
    body: row.body,
    position: { x: row.position_x, y: row.position_y },
    layer: 0,
    vizType: row.viz_type ?? undefined,
    vizPayload: row.viz_payload ?? undefined,
    status: row.status ?? undefined,
  }
}

function rowToEdge(row: DbEdgeRow): CanvasEdge {
  return {
    id: row.id,
    source: row.source_id,
    target: row.target_id,
    label: row.label ?? undefined,
  }
}

async function getProject(client: InsForgeClient, projectId: string): Promise<ProjectPayload | null> {
  const { data: project, error: projectError } = await client.database
    .from('projects')
    .select('id,name,center_card_id')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) throw projectError
  if (!project) return null

  const { data: cards, error: cardsError } = await client.database
    .from('cards')
    .select('*')
    .eq('project_id', projectId)

  if (cardsError) throw cardsError

  const { data: edges, error: edgesError } = await client.database
    .from('canvas_edges')
    .select('*')
    .eq('project_id', projectId)

  if (edgesError) throw edgesError

  return {
    projectId: project.id,
    projectName: project.name,
    centerCardId: project.center_card_id,
    cards: (cards ?? []).map((row) => rowToCard(row as DbCardRow)),
    edges: (edges ?? []).map((row) => rowToEdge(row as DbEdgeRow)),
  }
}

async function savePreview(
  client: InsForgeClient,
  projectId: string,
  preview: PreviewPayload,
): Promise<void> {
  const { error } = await client.database.from('previews').upsert([
    {
      id: preview.previewId,
      project_id: projectId,
      payload: preview,
    },
  ])

  if (error) throw error
}

async function loadPreview(client: InsForgeClient, previewId: string): Promise<PreviewPayload | null> {
  const { data, error } = await client.database
    .from('previews')
    .select('payload')
    .eq('id', previewId)
    .maybeSingle()

  if (error) throw error
  return (data?.payload as PreviewPayload | undefined) ?? null
}

async function deletePreview(client: InsForgeClient, previewId: string): Promise<void> {
  const { error } = await client.database.from('previews').delete().eq('id', previewId)
  if (error) throw error
}

async function commitPreview(
  client: InsForgeClient,
  projectId: string,
  preview: PreviewPayload,
): Promise<void> {
  await client.database.from('cards').delete().eq('project_id', projectId)
  await client.database.from('canvas_edges').delete().eq('project_id', projectId)

  if (preview.cards.length > 0) {
    const cardRows = preview.cards.map((card) => ({
      project_id: projectId,
      id: card.id,
      spec_file: card.specRef.file,
      spec_anchor: card.specRef.anchor ?? null,
      type: card.type,
      title: card.title,
      body: card.body,
      position_x: card.position.x,
      position_y: card.position.y,
      viz_type: card.vizType ?? null,
      viz_payload: card.vizPayload ?? null,
      status: card.status ?? null,
    }))

    const { error: cardError } = await client.database.from('cards').insert(cardRows)
    if (cardError) throw cardError
  }

  if (preview.edges.length > 0) {
    const edgeRows = preview.edges.map((edge) => ({
      project_id: projectId,
      id: edge.id,
      source_id: edge.source,
      target_id: edge.target,
      label: edge.label ?? null,
    }))

    const { error: edgeError } = await client.database.from('canvas_edges').insert(edgeRows)
    if (edgeError) throw edgeError
  }

  await client.database
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  await deletePreview(client, preview.previewId)
}

async function patchCard(
  client: InsForgeClient,
  projectId: string,
  cardId: string,
  patch: { title?: string; body?: string },
): Promise<Card | null> {
  const updates: Record<string, string> = {}
  if (patch.title !== undefined) updates.title = patch.title
  if (patch.body !== undefined) updates.body = patch.body

  if (Object.keys(updates).length === 0) return null

  const { data, error } = await client.database
    .from('cards')
    .update(updates)
    .eq('project_id', projectId)
    .eq('id', cardId)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return rowToCard(data as DbCardRow)
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({
    ...card,
    position: { ...card.position },
    specRef: { ...card.specRef },
  }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

function buildPreview(message: string, cards: Card[], edges: CanvasEdge[]): PreviewPayload {
  const previewId = `preview-${Date.now()}`
  const nextCards = cloneCards(cards)
  const nextEdges = cloneEdges(edges)

  const openQuestion: Card = {
    id: `oq-${Date.now()}`,
    specRef: { file: 'open-questions.md', anchor: 'OQ-preview' },
    type: 'open-question',
    title: 'Open question (preview)',
    body: `From chat: "${message}" — which enterprise domains should be allowed for Google login?`,
    position: { x: 520, y: -40 },
    layer: 1,
    parentCardId: 'product',
    status: 'proposed',
  }

  const featureCard = nextCards.find((card) => card.id === 'features')
  if (featureCard?.vizType === 'data-table' && featureCard.vizPayload) {
    const payload = featureCard.vizPayload as { columns: string[]; rows: string[][] }
    featureCard.vizPayload = {
      ...payload,
      rows: [...payload.rows, ['F-004', 'Google login', 'proposed', 'high']],
    }
  }

  nextCards.push(openQuestion)
  nextEdges.push({
    id: `e-preview-${openQuestion.id}`,
    source: 'features',
    target: openQuestion.id,
    label: 'raises',
  })

  return {
    previewId,
    cards: nextCards,
    edges: nextEdges,
    mdPatches: [
      {
        file: 'open-questions.md',
        action: 'add',
        anchor: 'OQ-preview',
        summary: 'Add open question about allowed Google domains',
      },
      {
        file: 'features.md',
        action: 'add',
        anchor: 'F-004',
        summary: 'Propose F-004 Google login feature',
      },
    ],
    summary: 'Preview adds F-004 Google login and an open question card linked from Features.',
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  return json({ ok: false, error: { code: 'bad_request', message } }, status)
}

function routerErrorResponse(
  code: string,
  message: string,
  status: number,
  zodIssues?: Array<{ path: string; message: string }>,
): Response {
  return json({ ok: false, error: { code, message, zodIssues } }, status)
}

function routerFailureStatus(code: string): number {
  switch (code) {
    case 'router_validation_failed':
      return 422
    case 'router_unconfigured':
      return 503
    case 'router_invalid_json':
    case 'router_upstream_error':
      return 502
    default:
      return 500
  }
}

function writerFailureStatus(code: string): number {
  switch (code) {
    case 'writer_validation_failed':
    case 'writer_invalid_output':
      return 422
    case 'writer_unconfigured':
      return 503
    case 'writer_no_features_op':
      return 400
    case 'writer_upstream_error':
      return 502
    default:
      return 500
  }
}

function writerErrorResponse(
  code: string,
  message: string,
  status: number,
  validationIssues?: string[],
): Response {
  return json({ ok: false, error: { code, message, validationIssues } }, status)
}

function defaultRouterContext(): RouterContext {
  return {
    projectName: 'NLIDE Demo',
    centerCardId: 'product',
    cards: [],
    edges: [],
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    let body: ApiRequest | null = null

    if (req.method === 'POST') {
      body = (await req.json()) as ApiRequest
    } else {
      const url = new URL(req.url)
      body = {
        action: (url.searchParams.get('action') as ApiRequest['action']) ?? 'health',
        projectId: url.searchParams.get('projectId') ?? DEFAULT_PROJECT_ID,
      }
    }

    if (!body?.action) {
      return errorResponse('Missing action')
    }

    if (body.action === 'health') {
      const hasSecrets = Boolean(Deno.env.get('INSFORGE_BASE_URL') && Deno.env.get('ANON_KEY'))
      return json({
        ok: true,
        service: 'nlide-api',
        hasSecrets,
        routerConfigured: isRouterConfigured(),
        featuresWriterConfigured: isFeaturesWriterConfigured(),
        mode: hasSecrets ? 'insforge' : 'stub-secrets-missing',
      })
    }

    const projectId = body.projectId ?? DEFAULT_PROJECT_ID
    const client = getClient()

    switch (body.action) {
      case 'get-project': {
        const project = await getProject(client, projectId)
        if (!project) {
          return json({
            projectId,
            projectName: 'NLIDE Demo Project',
            centerCardId: 'product',
            cards: [],
            edges: [],
            seeded: false,
          })
        }
        return json(project)
      }

      case 'get-translator-spec': {
        return json({ spec: handleGetTranslatorSpec() })
      }

      case 'route': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }

        const context = body.context ?? defaultRouterContext()
        const result = await routeIntent({ message: body.message.trim(), context })

        if (!result.ok) {
          return routerErrorResponse(
            result.error.code,
            result.error.message,
            routerFailureStatus(result.error.code),
            result.error.zodIssues,
          )
        }

        return json({ ok: true, plan: result.plan, model: result.model })
      }

      case 'route-golden': {
        const report = await runGoldenRouterTests(body.context)
        return json({ ok: true, ...report })
      }

      case 'write-features': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }
        if (!body.routerPlan) {
          return errorResponse('routerPlan is required')
        }

        const result = await writeFeaturesSection({
          userMessage: body.message.trim(),
          routerPlan: body.routerPlan,
          existingFeatureIds: body.existingFeatureIds,
          existingSection: body.existingSection,
        })

        if (!result.ok) {
          return writerErrorResponse(
            result.error.code,
            result.error.message,
            writerFailureStatus(result.error.code),
            result.error.validationIssues,
          )
        }

        return json({
          ok: true,
          section: result.section,
          entityId: result.entityId,
          action: result.action,
          model: result.model,
        })
      }

      case 'write-features-golden': {
        const report = await runGoldenFeaturesWriterTests()
        return json({ ok: true, ...report })
      }

      case 'intent': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }

        const context = body.context
        let cards = context?.cards ?? []
        let edges = context?.edges ?? []

        if (cards.length === 0) {
          const existing = await getProject(client, projectId)
          if (existing && existing.cards.length > 0) {
            cards = existing.cards
            edges = existing.edges
          }
        }

        const preview = buildPreview(body.message.trim(), cards, edges)
        await savePreview(client, projectId, preview)

        return json({ preview })
      }

      case 'commit': {
        if (!body.previewId) {
          return errorResponse('previewId is required')
        }

        const preview = await loadPreview(client, body.previewId)
        if (!preview) {
          return errorResponse('Preview not found', 404)
        }

        await commitPreview(client, projectId, preview)

        return json({
          committed: true,
          previewId: body.previewId,
          cards: preview.cards,
          edges: preview.edges,
        })
      }

      case 'discard': {
        if (!body.previewId) {
          return errorResponse('previewId is required')
        }

        await deletePreview(client, body.previewId)
        return json({ discarded: true, previewId: body.previewId })
      }

      case 'patch-card': {
        if (!body.cardId || !body.patch) {
          return errorResponse('cardId and patch are required')
        }

        const updated = await patchCard(client, projectId, body.cardId, body.patch)
        if (!updated) {
          return errorResponse('Card not found', 404)
        }

        return json({ card: updated })
      }

      default:
        return errorResponse(`Unknown action: ${body.action}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('nlide-api error:', message)
    return errorResponse(message, 500)
  }
}
