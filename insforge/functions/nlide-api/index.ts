import { createClient, type InsForgeClient } from 'npm:@insforge/sdk@latest'
import { handleGetTranslatorSpec } from './translator/index.ts'
import { runGoldenRouterTests } from './router/goldenRunner.ts'
import { isRouterConfigured, routeIntent } from './router/routeIntent.ts'
import type { RouterContext } from './router/types.ts'
import type { RouterPlan } from './_shared/translator/types.ts'
import { writeFeaturesSection, isFeaturesWriterConfigured } from './writers/featuresWriter.ts'
import { runGoldenFeaturesWriterTests } from './writers/goldenRunner.ts'
import { applyPatchesToSpec, runWritersFromPlan } from './writers/pipeline.ts'
import { runPhase4Smoke } from './writers/phase4Smoke.ts'
import { writeRemainingSection } from './writers/remainingWriter.ts'
import { writeTaskSection, isTaskWriterConfigured } from './writers/taskWriter.ts'
import { validateSpec } from './validator/validateSpec.ts'
import { runCanvasMapperGoldenTests } from './canvas/goldenRunner.ts'
import { runExportSmoke } from './export/exportSmoke.ts'
import {
  loadProjectName,
  loadSpecSections,
  prepareCommitExport,
  saveSpecSections,
} from './export/specStore.ts'
import { assembleFullExportedSpec, buildSectionRowsForCommit } from './_shared/translator/specExport.ts'
import { assembleSpecFile } from './_shared/translator/specFolderLayout.ts'
import {
  buildIntentPreview,
  isIntentPipelineConfigured,
} from './intent/buildIntentPreview.ts'
import {
  buildExecutionPlan,
  isExecutionPlannerConfigured,
  synthesisFromApiCards,
} from './planner/buildExecutionPlan.ts'
import type { CardSynthesisBundle } from './_shared/translator/cardSynthesis.ts'
import { resolveExecutionPlannerSpec } from './_shared/translator/mergeExecutionPlanSpec.ts'
import {
  commitExecutionPlan,
  discardExecutionPlanPreview,
  loadExecutionPlanState,
  saveExecutionPlanPreview,
} from './planner/executionPlanStore.ts'

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
  section?: string
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
    | 'write-tasks'
    | 'write-remaining'
    | 'run-writers'
    | 'validate-spec'
    | 'phase4-smoke'
    | 'canvas-mapper-golden'
    | 'export-smoke'
    | 'intent'
    | 'commit'
    | 'discard'
    | 'patch-card'
    | 'get-spec-file'
    | 'plan-execution'
    | 'get-execution-plan'
    | 'commit-execution-plan'
    | 'discard-execution-plan'
  projectId?: string
  specBundle?: Record<string, string>
  cardSynthesis?: CardSynthesisBundle
  projectName?: string
  file?: string
  message?: string
  previewId?: string
  cardId?: string
  patch?: { title?: string; body?: string }
  context?: RouterContext
  routerPlan?: RouterPlan
  existingFeatureIds?: string[]
  existingSection?: string
  existingTaskIds?: string[]
  linkedFeatureId?: string
  targetFile?: string
  existingContent?: string
  existingEntityIds?: string[]
  existingDecisionIds?: string[]
  existingOpenQuestionIds?: string[]
  existingSpec?: Record<string, string>
  spec?: Record<string, string>
  validationMode?: 'preview' | 'commit'
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

async function commitCanvas(
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

async function syncCardSpecSection(
  client: InsForgeClient,
  projectId: string,
  card: Card,
): Promise<void> {
  const file = card.specRef.file
  if (!file || file === 'INDEX.md') return

  const anchor =
    card.type === 'product' ||
    card.type === 'users' ||
    card.type === 'constraints' ||
    card.type === 'architecture'
      ? ''
      : (card.specRef.anchor ?? card.id)

  const body = card.body?.trim()
  if (!body) return

  const { error } = await client.database.from('spec_sections').upsert([
    {
      project_id: projectId,
      file,
      anchor,
      content: body,
    },
  ])

  if (error) throw error
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

  const card = rowToCard(data as DbCardRow)
  await syncCardSpecSection(client, projectId, card)
  return card
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

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
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
    case 'writer_no_tasks_op':
    case 'writer_no_file_op':
    case 'writer_invalid_target':
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

function intentFailureStatus(code: string): number {
  if (code === 'intent_pipeline_unconfigured' || code === 'router_unconfigured' || code === 'writer_unconfigured') {
    return 503
  }
  if (code === 'router_validation_failed' || code === 'validation_failed' || code === 'writer_validation_failed') {
    return 422
  }
  if (code === 'router_invalid_json' || code === 'router_upstream_error' || code === 'writer_upstream_error') {
    return 502
  }
  return 500
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
        taskWriterConfigured: isTaskWriterConfigured(),
        phase4PipelineConfigured: isFeaturesWriterConfigured() && isTaskWriterConfigured(),
        intentPipelineConfigured: isIntentPipelineConfigured(),
        executionPlannerConfigured: isExecutionPlannerConfigured(),
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

      case 'write-tasks': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }
        if (!body.routerPlan) {
          return errorResponse('routerPlan is required')
        }

        const result = await writeTaskSection({
          userMessage: body.message.trim(),
          routerPlan: body.routerPlan,
          existingTaskIds: body.existingTaskIds,
          existingSection: body.existingSection,
          linkedFeatureId: body.linkedFeatureId,
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
          featureId: result.featureId,
          action: result.action,
          model: result.model,
        })
      }

      case 'write-remaining': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }
        if (!body.routerPlan) {
          return errorResponse('routerPlan is required')
        }
        if (!body.targetFile) {
          return errorResponse('targetFile is required')
        }

        const result = await writeRemainingSection({
          userMessage: body.message.trim(),
          routerPlan: body.routerPlan,
          targetFile: body.targetFile,
          existingContent: body.existingContent,
          existingEntityIds: body.existingEntityIds,
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
          targetFile: result.targetFile,
          entityId: result.entityId,
          action: result.action,
          model: result.model,
        })
      }

      case 'run-writers': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }
        if (!body.routerPlan) {
          return errorResponse('routerPlan is required')
        }

        const writers = await runWritersFromPlan({
          userMessage: body.message.trim(),
          routerPlan: body.routerPlan,
          existingSpec: body.existingSpec,
          existingFeatureIds: body.existingFeatureIds,
          existingTaskIds: body.existingTaskIds,
          existingDecisionIds: body.existingDecisionIds,
          existingOpenQuestionIds: body.existingOpenQuestionIds,
        })

        if (!writers.ok) {
          return writerErrorResponse(
            writers.error.code,
            writers.error.message,
            writerFailureStatus(writers.error.code),
            writers.error.validationIssues,
          )
        }

        const spec = applyPatchesToSpec(body.existingSpec ?? {}, writers.patches)
        const validation = validateSpec({
          spec,
          routerPlan: body.routerPlan,
          mode: body.validationMode ?? 'preview',
        })

        if (!validation.ok) {
          return json(
            {
              ok: false,
              error: {
                code: 'validation_failed',
                message: 'Spec failed validation after writers',
                issues: [...validation.issues, ...validation.warnings],
              },
              patches: writers.patches,
              spec,
            },
            422,
          )
        }

        return json({
          ok: true,
          patches: writers.patches,
          spec,
          warnings: validation.warnings,
          models: writers.models,
        })
      }

      case 'validate-spec': {
        if (!body.spec) {
          return errorResponse('spec is required')
        }

        const validation = validateSpec({
          spec: body.spec,
          routerPlan: body.routerPlan,
          mode: body.validationMode ?? 'preview',
        })

        return json({
          ok: validation.ok,
          issues: validation.issues,
          warnings: validation.warnings,
          blocksPreview: validation.blocksPreview,
          blocksCommit: validation.blocksCommit,
        })
      }

      case 'phase4-smoke': {
        const report = await runPhase4Smoke()
        if (!report.ok) {
          return json(report, report.stage === 'writers' ? 502 : 422)
        }
        return json({ ok: true, ...report })
      }

      case 'canvas-mapper-golden': {
        const report = runCanvasMapperGoldenTests()
        if (!report.passedBar) {
          return json(report, 422)
        }
        return json({ ok: true, ...report })
      }

      case 'export-smoke': {
        const report = runExportSmoke()
        if (!report.ok) {
          return json(report, 422)
        }
        return json({ ok: true, ...report })
      }

      case 'intent': {
        if (!body.message?.trim()) {
          return errorResponse('message is required')
        }

        const context = body.context
        let cards = context?.cards ?? []
        let edges = context?.edges ?? []
        let centerCardId = context?.centerCardId ?? 'product'

        const project = await getProject(client, projectId)
        const projectName = project?.projectName ?? 'NLIDE Demo Project'

        if (cards.length === 0 && project && project.cards.length > 0) {
          cards = project.cards
          edges = project.edges
          centerCardId = project.centerCardId
        }

        const specRows = await loadSpecSections(client, projectId)

        const result = await buildIntentPreview({
          message: body.message.trim(),
          cards,
          edges,
          centerCardId,
          projectName,
          specRows,
        })

        if (!result.ok) {
          return json(
            {
              ok: false,
              stage: result.stage,
              error: result.error,
            },
            intentFailureStatus(result.error.code),
          )
        }

        const preview = result.preview as PreviewPayload
        await savePreview(client, projectId, preview)

        return json({
          preview,
          routerModel: result.routerModel,
          writerModels: result.writerModels,
          warnings: result.warnings,
        })
      }

      case 'commit': {
        if (!body.previewId) {
          return errorResponse('previewId is required')
        }

        const preview = await loadPreview(client, body.previewId)
        if (!preview) {
          return errorResponse('Preview not found', 404)
        }

        const projectName = await loadProjectName(client, projectId)
        const existingRows = await loadSpecSections(client, projectId)

        const exportResult = await prepareCommitExport({
          projectName,
          existingRows,
          patches: preview.mdPatches,
          cards: preview.cards,
        })

        if (!exportResult.ok) {
          return json(
            {
              ok: false,
              error: {
                code: exportResult.code,
                message: 'Spec failed validation before commit',
                issues: exportResult.issues,
              },
            },
            422,
          )
        }

        const rows = buildSectionRowsForCommit({
          existingRows,
          patches: preview.mdPatches,
          cards: preview.cards,
        })

        await saveSpecSections(client, projectId, rows)
        await commitCanvas(client, projectId, preview)

        return json({
          committed: true,
          previewId: body.previewId,
          cards: preview.cards,
          edges: preview.edges,
          exportedSpec: exportResult.exportedSpec,
          exportWarnings: exportResult.warnings,
          sectionCount: exportResult.sectionCount,
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

      case 'get-spec-file': {
        if (!body.file?.trim()) {
          return errorResponse('file is required')
        }

        const file = body.file.trim()
        const rows = await loadSpecSections(client, projectId)
        const projectName = await loadProjectName(client, projectId)

        if (file === 'INDEX.md') {
          const exportedSpec = assembleFullExportedSpec({ projectName, rows })
          return json({ file, content: exportedSpec['INDEX.md'] ?? '' })
        }

        const fileRows = rows.filter((row) => row.file === file)
        const content = assembleSpecFile(
          file,
          fileRows.map((row) => ({ anchor: row.anchor, content: row.content })),
        )

        return json({ file, content })
      }

      case 'get-execution-plan': {
        const state = await loadExecutionPlanState(client, projectId)
        return json(state)
      }

      case 'plan-execution': {
        if (!isExecutionPlannerConfigured()) {
          return json(
            {
              ok: false,
              error: {
                code: 'execution_planner_unconfigured',
                message:
                  'OPENROUTER_API_KEY required for plan-execution — no stub fallback',
              },
            },
            503,
          )
        }

        const rows = await loadSpecSections(client, projectId)
        const projectName = body.projectName ?? (await loadProjectName(client, projectId))

        let spec: Record<string, string>
        let specSource: 'postgres' | 'client'

        if (body.specBundle && Object.keys(body.specBundle).length > 0) {
          const fromPostgres =
            rows.length > 0
              ? assembleFullExportedSpec({ projectName, rows })
              : undefined
          spec = resolveExecutionPlannerSpec({
            clientBundle: body.specBundle,
            fromPostgres,
          })
          specSource = 'client'
        } else if (rows.length > 0) {
          spec = assembleFullExportedSpec({ projectName, rows })
          specSource = 'postgres'
        } else {
          return errorResponse(
            'No spec in Postgres and no specBundle provided — assemble spec client-side',
            400,
          )
        }

        let synthesis: CardSynthesisBundle
        if (body.cardSynthesis?.cards?.length) {
          synthesis = body.cardSynthesis
        } else {
          const project = await getProject(client, projectId)
          synthesis = project?.cards.length
            ? synthesisFromApiCards(project.cards)
            : { cards: [], byFile: {} }
        }

        const result = await buildExecutionPlan({ spec, synthesis, projectName })

        if (!result.ok) {
          return json(
            {
              ok: false,
              error: {
                code: result.code,
                message: result.message,
                issues: result.issues,
                zodIssues: result.zodIssues,
                tasksMd: spec['tasks.md'] ?? '',
              },
            },
            422,
          )
        }

        const previewId = crypto.randomUUID()
        await saveExecutionPlanPreview(
          client,
          projectId,
          previewId,
          result.plan,
          result.tasksMd,
        )

        return json({
          ok: true,
          previewId,
          plan: result.plan,
          model: result.model,
          specSource,
          tasksMd: result.tasksMd,
          warnings: result.warnings ?? [],
        })
      }

      case 'commit-execution-plan': {
        if (!body.previewId) {
          return errorResponse('previewId is required')
        }

        const committed = await commitExecutionPlan(client, projectId, body.previewId)
        if (!committed) {
          return errorResponse('Execution plan preview not found', 404)
        }

        return json({ committed: true, plan: committed.plan, tasksMd: committed.tasksMd })
      }

      case 'discard-execution-plan': {
        if (!body.previewId) {
          return errorResponse('previewId is required')
        }

        const discarded = await discardExecutionPlanPreview(client, body.previewId)
        if (!discarded) {
          return errorResponse('Execution plan preview not found', 404)
        }

        return json({ discarded: true, previewId: body.previewId })
      }

      default:
        return errorResponse(`Unknown action: ${body.action}`)
    }
  } catch (error) {
    const message = errorMessage(error)
    console.error('nlide-api error:', message, error)
    return errorResponse(message, 500)
  }
}
