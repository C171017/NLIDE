import { lazy, Suspense } from 'react'
import type { ProgressChecklistPayload, VizType } from '../../types/canvas'

const MermaidViz = lazy(() => import('./MermaidViz'))
const MarkdownTableViz = lazy(() => import('./MarkdownTableViz'))
const ForceGraphViz = lazy(() => import('./ForceGraphViz'))
const DataTableViz = lazy(() => import('./DataTableViz'))
const ProgressChecklistViz = lazy(() => import('./ProgressChecklistViz'))

interface VizEmbedProps {
  vizType: VizType
  payload: unknown
  compact?: boolean
}

export default function VizEmbed({ vizType, payload, compact = false }: VizEmbedProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-md border border-[#2d3348] bg-[#141824] px-3 py-2 text-xs text-[#9aa3b2]">
          Loading visualization…
        </div>
      }
    >
      {vizType === 'mermaid' && <MermaidViz source={String(payload ?? '')} compact={compact} />}
      {vizType === 'markdown-table' && <MarkdownTableViz source={String(payload ?? '')} />}
      {vizType === 'force-graph' && <ForceGraphViz data={payload} compact={compact} />}
      {vizType === 'data-table' && <DataTableViz data={payload} compact={compact} />}
      {vizType === 'progress-checklist' && (
        <ProgressChecklistViz data={payload as ProgressChecklistPayload} compact={compact} />
      )}
    </Suspense>
  )
}
