import type { RouterContext } from '../router/types.ts'
import { routeIntent } from '../router/routeIntent.ts'
import { isRouterConfigured } from '../router/routeIntent.ts'
import { applyPatchesToSpec, runWritersFromPlan } from '../writers/pipeline.ts'
import type { WriterPatch } from '../writers/types.ts'
import { isFeaturesWriterConfigured } from '../writers/featuresWriter.ts'
import { isTaskWriterConfigured } from '../writers/taskWriter.ts'
import { validateSpec } from '../validator/validateSpec.ts'
import {
  mapCanvasToPreview,
  type WriterEntityHint,
} from '../_shared/translator/canvasMapper.ts'
import type { CanvasCard, CanvasEdge, MdPatch } from '../_shared/translator/canvasTypes.ts'
import { extractEntityIds } from '../_shared/translator/extractEntityIds.ts'
import { assembleFullExportedSpec, type SpecSectionRow } from '../_shared/translator/specExport.ts'

interface IntentCard {
  id: string
  specRef: { file: string; anchor?: string }
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

interface IntentEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface BuildIntentPreviewInput {
  message: string
  cards: IntentCard[]
  edges: IntentEdge[]
  centerCardId: string
  projectName: string
  specRows: SpecSectionRow[]
}

export type BuildIntentPreviewResult =
  | {
      ok: true
      preview: ReturnType<typeof mapCanvasToPreview>
      routerModel: string
      writerModels: string[]
      warnings: string[]
    }
  | {
      ok: false
      stage: 'router' | 'writers' | 'validator' | 'unconfigured'
      error: {
        code: string
        message: string
        zodIssues?: Array<{ path: string; message: string }>
        validationIssues?: string[]
        failedWriter?: string
        issues?: Array<{ ruleId: string; message: string; file?: string }>
      }
    }

export function isIntentPipelineConfigured(): boolean {
  return isRouterConfigured() && isFeaturesWriterConfigured() && isTaskWriterConfigured()
}

function specMapFromRows(rows: SpecSectionRow[], projectName: string): Record<string, string> {
  return assembleFullExportedSpec({ projectName, rows })
}

function toCanvasCards(cards: IntentCard[]): CanvasCard[] {
  return cards.map((card) => ({
    id: card.id,
    specRef: card.specRef,
    type: card.type as CanvasCard['type'],
    title: card.title,
    body: card.body,
    position: card.position,
    layer: (card.layer ?? 0) as 0 | 1,
    parentCardId: card.parentCardId,
    vizType: card.vizType as CanvasCard['vizType'],
    vizPayload: card.vizPayload,
    status: card.status as CanvasCard['status'],
  }))
}

function toRouterContext(input: BuildIntentPreviewInput): RouterContext {
  return {
    projectName: input.projectName,
    centerCardId: input.centerCardId,
    cards: input.cards.map((card) => ({
      id: card.id,
      type: card.type,
      title: card.title,
      body: card.body,
      specRef: card.specRef,
      status: card.status,
    })),
    edges: input.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
    })),
  }
}

function parseSectionTitle(section: string, fallback: string): string {
  const heading = section.match(/^### [^:\n]+:\s*(.+)$/m)?.[1]?.trim()
  return heading || fallback
}

function writerPatchesToHints(patches: WriterPatch[]): WriterEntityHint[] {
  return patches.map((patch) => ({
    entityId: patch.entityId ?? patch.anchor ?? '',
    file: patch.file,
    action: patch.action,
    title: parseSectionTitle(patch.section, patch.entityId ?? patch.anchor ?? patch.file),
    body: patch.section,
    summary: `${patch.action} ${patch.entityId ?? patch.anchor ?? ''}`.trim(),
    linkedFeatureId:
      patch.file === 'tasks.md'
        ? patch.section.match(/- \*\*Feature:\*\*\s*(F-\d{3})/)?.[1]
        : undefined,
  }))
}

function writerPatchesToMdPatches(patches: WriterPatch[]): MdPatch[] {
  return patches.map((patch) => ({
    file: patch.file,
    action: patch.action,
    anchor: patch.anchor ?? patch.entityId,
    summary: `${patch.action} · ${patch.anchor ?? patch.entityId ?? patch.file}`,
    section: patch.section,
  }))
}

/** Router → writers → validator → canvas mapper. No stub fallback. */
export async function buildIntentPreview(
  input: BuildIntentPreviewInput,
): Promise<BuildIntentPreviewResult> {
  if (!isIntentPipelineConfigured()) {
    return {
      ok: false,
      stage: 'unconfigured',
      error: {
        code: 'intent_pipeline_unconfigured',
        message: 'OPENROUTER_API_KEY required for router + writers on action:intent',
      },
    }
  }

  const route = await routeIntent({
    message: input.message,
    context: toRouterContext(input),
  })

  if (!route.ok) {
    return {
      ok: false,
      stage: 'router',
      error: {
        code: route.error.code,
        message: route.error.message,
        zodIssues: route.error.zodIssues,
      },
    }
  }

  const existingSpec = specMapFromRows(input.specRows, input.projectName)
  const featuresContent = existingSpec['features.md'] ?? ''
  const tasksContent = existingSpec['tasks.md'] ?? ''
  const decisionsContent = existingSpec['decisions.md'] ?? ''
  const openQuestionsContent = existingSpec['open-questions.md'] ?? ''

  const writers = await runWritersFromPlan({
    userMessage: input.message,
    routerPlan: route.plan,
    existingSpec,
    existingFeatureIds: extractEntityIds(featuresContent, 'F'),
    existingTaskIds: extractEntityIds(tasksContent, 'T'),
    existingDecisionIds: extractEntityIds(decisionsContent, 'D'),
    existingOpenQuestionIds: extractEntityIds(openQuestionsContent, 'OQ'),
  })

  if (!writers.ok) {
    return {
      ok: false,
      stage: 'writers',
      error: {
        code: writers.error.code,
        message: writers.error.message,
        validationIssues: writers.error.validationIssues,
        failedWriter: writers.error.failedWriter,
      },
    }
  }

  const specAfterPatches = applyPatchesToSpec(existingSpec, writers.patches)
  const validation = validateSpec({
    spec: specAfterPatches,
    routerPlan: route.plan,
    mode: 'preview',
  })

  if (!validation.ok) {
    return {
      ok: false,
      stage: 'validator',
      error: {
        code: 'validation_failed',
        message: 'Spec failed validation after writers',
        issues: [...validation.issues, ...validation.warnings].map((row) => ({
          ruleId: row.ruleId,
          message: row.message,
          file: row.file,
        })),
      },
    }
  }

  const writerHints = writerPatchesToHints(writers.patches)
  const mdPatches = writerPatchesToMdPatches(writers.patches)

  const preview = mapCanvasToPreview({
    committedCards: toCanvasCards(input.cards),
    committedEdges: input.edges,
    centerCardId: input.centerCardId,
    routerPlan: route.plan,
    writerHints,
    mdPatches,
    userMessage: input.message,
  })

  return {
    ok: true,
    preview,
    routerModel: route.model,
    writerModels: writers.models,
    warnings: validation.warnings.map((row) => row.message),
  }
}
