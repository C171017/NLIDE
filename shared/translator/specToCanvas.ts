/**
 * spec/*.md → canvas cards + edges — overview load from markdown SSOT.
 * **[AI-INFERRED]** 2026-06-06 — parse Flow B entity sections; assign layer/parent from canvasPlacementRules.
 */

import type { CanvasCard, CanvasEdge, CardStatus } from './canvasTypes.ts'
import { getDefaultAnchor } from './canvasPlacementRules.ts'

export interface SpecFileMap {
  [file: string]: string
}

export interface SpecCanvasState {
  projectName: string
  centerCardId: string
  cards: CanvasCard[]
  edges: CanvasEdge[]
}

const ENTITY_HEADING_RE = /^###\s+((?:F|T|D|OQ|oq)-\d+):\s*(.+)$/im

const FEATURE_STATUS_RE = /-\s+\*\*Status:\*\*\s*(\S+)/i
const FEATURE_PRIORITY_RE = /-\s+\*\*Priority:\*\*\s*(\S+)/i
const FEATURE_DESC_RE = /-\s+\*\*Description:\*\*\s*(.+)/i

const TASK_FEATURE_RE = /-\s+\*\*Feature:\*\*\s*(F-\d{3})/i
const TASK_PILLAR_RE = /-\s+\*\*Pillar:\*\*\s*(frontend|backend|product)/i
const TASK_STATUS_RE = /-\s+\*\*Status:\*\*\s*(\S+)/i
const TASK_DONE_RE = /-\s+\*\*Done when:\*\*\s*(.+)/i

type PillarId = 'frontend' | 'backend' | 'product'

const OQ_QUESTION_RE = /-\s+\*\*Question:\*\*\s*(.+)/i
const OQ_STATUS_RE = /-\s+\*\*Status:\*\*\s*(\S+)/i

const DECISION_DECISION_RE = /-\s+\*\*Decision:\*\*\s*(.+)/i
const DECISION_STATUS_RE = /-\s+\*\*Status:\*\*\s*(\S+)/i

function normalizeEntityId(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper.startsWith('OQ-')) return upper
  return upper
}

function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>()
  const parts = content.split(/^##\s+/m)

  if (parts[0]?.trim()) {
    const intro = parts[0].replace(/^#\s[^\n]*\n?/, '').trim()
    if (intro) sections.set('', intro)
  }

  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i]
    const newline = part.indexOf('\n')
    const heading = newline === -1 ? part.trim() : part.slice(0, newline).trim()
    const body = newline === -1 ? '' : part.slice(newline + 1).trim()
    sections.set(heading.toLowerCase(), body)
  }

  return sections
}

function parseEntitySections(content: string): Array<{ id: string; title: string; body: string }> {
  const entities: Array<{ id: string; title: string; body: string }> = []
  const chunks = content.split(/^###\s+/m).slice(1)

  for (const chunk of chunks) {
    const firstLineEnd = chunk.indexOf('\n')
    const firstLine = firstLineEnd === -1 ? chunk.trim() : chunk.slice(0, firstLineEnd).trim()
    const match = firstLine.match(/^((?:F|T|D|OQ|oq)-\d+):\s*(.+)$/i)
    if (!match) continue

    const id = normalizeEntityId(match[1])
    const title = match[2].trim()
    const body = firstLineEnd === -1 ? '' : chunk.slice(firstLineEnd + 1).trim()
    entities.push({ id, title, body })
  }

  return entities
}

function fieldMatch(body: string, re: RegExp): string | undefined {
  const match = body.match(re)
  return match?.[1]?.trim()
}

function mapFeatureStatus(body: string): CardStatus | undefined {
  const raw = fieldMatch(body, FEATURE_STATUS_RE)
  if (!raw) return undefined
  if (raw === 'proposed' || raw === 'approved' || raw === 'in_progress' || raw === 'done') {
    return raw
  }
  return undefined
}

function mapTaskStatus(body: string): CardStatus | undefined {
  const raw = fieldMatch(body, TASK_STATUS_RE)
  if (raw === 'todo') return 'proposed'
  if (raw === 'in_progress') return 'in_progress'
  if (raw === 'done') return 'done'
  if (raw === 'blocked') return 'proposed'
  return undefined
}

function featureCardBody(body: string): string {
  const description = fieldMatch(body, FEATURE_DESC_RE)
  const status = fieldMatch(body, FEATURE_STATUS_RE)
  const priority = fieldMatch(body, FEATURE_PRIORITY_RE)

  if (description) {
    const meta = [status && `Status: ${status}`, priority && `Priority: ${priority}`]
      .filter(Boolean)
      .join(' · ')
    return meta ? `${description} — ${meta}` : description
  }

  return body.split('\n').slice(0, 2).join(' ').trim()
}

function taskCardBody(body: string): string {
  const doneWhen = fieldMatch(body, TASK_DONE_RE)
  const status = fieldMatch(body, TASK_STATUS_RE)
  if (doneWhen) {
    return status ? `${doneWhen} (${status})` : doneWhen
  }
  return body.split('\n').slice(0, 3).join(' ').trim()
}

function openQuestionCardBody(body: string): string {
  const question = fieldMatch(body, OQ_QUESTION_RE)
  const status = fieldMatch(body, OQ_STATUS_RE)
  if (question) {
    return status ? `${question} — ${status}` : question
  }
  return body.split('\n').slice(0, 2).join(' ').trim()
}

function decisionCardBody(body: string): string {
  const decision = fieldMatch(body, DECISION_DECISION_RE)
  const status = fieldMatch(body, DECISION_STATUS_RE)
  if (decision) {
    return status ? `${decision} (${status})` : decision
  }
  return body.split('\n').slice(0, 2).join(' ').trim()
}

function firstParagraph(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(Boolean) ?? text.trim()
}

function sectionText(sections: Map<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = sections.get(key.toLowerCase())
    if (value?.trim()) return value.trim()
  }
  return sections.get('')?.trim() ?? ''
}

export function parseProjectNameFromIndex(indexMd: string): string {
  const titleMatch = indexMd.match(/^#\s+(.+?)(?:\s*—|\s+Spec Index)/im)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  return 'NLIDE'
}

function hasEntitySections(content: string): boolean {
  return ENTITY_HEADING_RE.test(content)
}

function addEdge(edges: CanvasEdge[], source: string, target: string, label: string) {
  const id = `e-${source}-${target}-${label.replace(/\s+/g, '-')}`
  if (edges.some((edge) => edge.id === id)) return
  edges.push({ id, source, target, label })
}

function parseTaskPillar(body: string): PillarId | undefined {
  const match = body.match(TASK_PILLAR_RE)
  if (!match) return undefined
  return match[1].toLowerCase() as PillarId
}

function applyCardPlacement(card: CanvasCard, pillarOverride?: PillarId): void {
  if (card.type === 'index') return
  const anchor = getDefaultAnchor(card.type)
  if (!anchor) return

  card.layer = anchor.layer
  card.parentCardId = pillarOverride ?? anchor.parentCardId

  if (anchor.layer === 0) {
    card.position = { ...anchor.defaultOffset }
  }
}

export function buildCanvasFromSpec(files: SpecFileMap): SpecCanvasState {
  const cards: CanvasCard[] = []
  const edges: CanvasEdge[] = []
  const cardIds = new Set<string>()

  const indexMd = files['INDEX.md'] ?? ''
  const projectName = parseProjectNameFromIndex(indexMd)

  const productMd = files['product.md'] ?? ''
  const productSections = parseSections(productMd)
  const vision = sectionText(productSections, 'vision') || firstParagraph(productMd.replace(/^#\s[^\n]*\n?/, ''))

  cards.push({
    id: 'product',
    specRef: { file: 'product.md' },
    type: 'product',
    title: projectName,
    body: vision,
    position: { x: 0, y: 0 },
    layer: 0,
    status: 'approved',
  })
  cardIds.add('product')
  applyCardPlacement(cards[cards.length - 1])

  const archMd = files['architecture.md'] ?? ''
  const archSections = parseSections(archMd)
  const frontendBody = sectionText(archSections, 'frontend')
  const backendBody = sectionText(archSections, 'backend')
  const overviewBody = sectionText(archSections, 'overview')

  if (frontendBody) {
    cards.push({
      id: 'frontend',
      specRef: { file: 'architecture.md', anchor: 'frontend' },
      type: 'frontend',
      title: 'Frontend',
      body: firstParagraph(frontendBody),
      position: { x: 0, y: 0 },
      layer: 0,
      status: 'in_progress',
    })
    cardIds.add('frontend')
    addEdge(edges, 'product', 'frontend', 'has')
    applyCardPlacement(cards[cards.length - 1])
  }

  if (backendBody) {
    cards.push({
      id: 'backend',
      specRef: { file: 'architecture.md', anchor: 'backend' },
      type: 'backend',
      title: 'Backend',
      body: firstParagraph(backendBody),
      position: { x: 0, y: 0 },
      layer: 0,
      status: 'in_progress',
    })
    cardIds.add('backend')
    addEdge(edges, 'product', 'backend', 'has')
    applyCardPlacement(cards[cards.length - 1])
  }

  if (frontendBody && backendBody) {
    addEdge(edges, 'frontend', 'backend', 'calls')
  }

  if (overviewBody) {
    cards.push({
      id: 'architecture',
      specRef: { file: 'architecture.md', anchor: 'overview' },
      type: 'architecture',
      title: 'Architecture',
      body: firstParagraph(overviewBody),
      position: { x: 0, y: 0 },
      layer: 0,
      status: 'approved',
    })
    cardIds.add('architecture')
    if (cardIds.has('backend')) {
      addEdge(edges, 'backend', 'architecture', 'describes')
    }
    applyCardPlacement(cards[cards.length - 1])
  }

  const usersMd = files['users.md'] ?? ''
  if (usersMd.trim() && !usersMd.includes('_(empty')) {
    const usersSections = parseSections(usersMd)
    const primary = sectionText(usersSections, 'primary users') || firstParagraph(usersMd.replace(/^#\s[^\n]*\n?/, ''))
    if (primary) {
      cards.push({
        id: 'users',
        specRef: { file: 'users.md' },
        type: 'users',
        title: 'Users',
        body: firstParagraph(primary),
        position: { x: 0, y: 0 },
        layer: 0,
        status: 'approved',
      })
      cardIds.add('users')
      addEdge(edges, 'product', 'users', 'serves')
      applyCardPlacement(cards[cards.length - 1])
    }
  }

  const constraintsMd = files['constraints.md'] ?? ''
  if (constraintsMd.trim() && !constraintsMd.includes('_(No ')) {
    const constraintSections = parseSections(constraintsMd)
    const stack = sectionText(constraintSections, 'stack')
    if (stack) {
      cards.push({
        id: 'constraints',
        specRef: { file: 'constraints.md' },
        type: 'constraint',
        title: 'Constraints',
        body: firstParagraph(stack),
        position: { x: 0, y: 0 },
        layer: 0,
        status: 'approved',
      })
      cardIds.add('constraints')
      addEdge(edges, 'product', 'constraints', 'limits')
      applyCardPlacement(cards[cards.length - 1])
    }
  }

  const featuresMd = files['features.md'] ?? ''
  if (hasEntitySections(featuresMd)) {
    for (const entity of parseEntitySections(featuresMd)) {
      cards.push({
        id: entity.id,
        specRef: { file: 'features.md', anchor: entity.id },
        type: 'feature',
        title: `${entity.id}: ${entity.title}`,
        body: featureCardBody(entity.body),
        position: { x: 0, y: 0 },
        layer: 0,
        status: mapFeatureStatus(entity.body),
      })
      cardIds.add(entity.id)
      addEdge(edges, 'product', entity.id, 'contains')
      applyCardPlacement(cards[cards.length - 1])
    }
  }

  const tasksMd = files['tasks.md'] ?? ''
  if (hasEntitySections(tasksMd)) {
    for (const entity of parseEntitySections(tasksMd)) {
      const featureId = fieldMatch(entity.body, TASK_FEATURE_RE)
      const pillar = parseTaskPillar(entity.body)
      cards.push({
        id: entity.id,
        specRef: { file: 'tasks.md', anchor: entity.id },
        type: 'task',
        title: `${entity.id}: ${entity.title}`,
        body: taskCardBody(entity.body),
        position: { x: 0, y: 0 },
        layer: 0,
        status: mapTaskStatus(entity.body),
      })
      cardIds.add(entity.id)
      applyCardPlacement(cards[cards.length - 1], pillar)

      const parentPillar = cards[cards.length - 1].parentCardId
      if (parentPillar && cardIds.has(parentPillar)) {
        addEdge(edges, parentPillar, entity.id, 'implements')
      }

      if (featureId && cardIds.has(featureId)) {
        addEdge(edges, featureId, entity.id, 'implements')
      }
    }
  }

  const decisionsMd = files['decisions.md'] ?? ''
  if (hasEntitySections(decisionsMd)) {
    for (const entity of parseEntitySections(decisionsMd)) {
      cards.push({
        id: entity.id,
        specRef: { file: 'decisions.md', anchor: entity.id },
        type: 'decision',
        title: `${entity.id}: ${entity.title}`,
        body: decisionCardBody(entity.body),
        position: { x: 0, y: 0 },
        layer: 0,
        status: 'approved',
      })
      cardIds.add(entity.id)
      if (cardIds.has('backend')) {
        addEdge(edges, 'backend', entity.id, 'decided')
      } else {
        addEdge(edges, 'product', entity.id, 'decided')
      }
      applyCardPlacement(cards[cards.length - 1])
    }
  }

  const openQuestionsMd = files['open-questions.md'] ?? ''
  if (hasEntitySections(openQuestionsMd)) {
    for (const entity of parseEntitySections(openQuestionsMd)) {
      cards.push({
        id: entity.id,
        specRef: { file: 'open-questions.md', anchor: entity.id },
        type: 'open-question',
        title: `${entity.id}: ${entity.title}`,
        body: openQuestionCardBody(entity.body),
        position: { x: 0, y: 0 },
        layer: 0,
        status: 'proposed',
      })
      cardIds.add(entity.id)
      addEdge(edges, 'product', entity.id, 'raises')
      applyCardPlacement(cards[cards.length - 1])
    }
  }

  return {
    projectName,
    centerCardId: 'product',
    cards,
    edges,
  }
}
