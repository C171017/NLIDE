import type { CanvasEdge, Card } from '../types/canvas'
import { DEFAULT_PROJECT_ID } from './constants'
import { loadSpecCanvas, loadSpecProjectName } from './loadSpecCanvas'

const STORAGE_KEY = 'nlide.projects.v1'

export interface ProjectPayload {
  projectId: string
  projectName: string
  centerCardId: string
  cards: Card[]
  edges: CanvasEdge[]
}

export interface ProjectSummary extends ProjectPayload {
  updatedAt: string
}

interface StoredProject {
  projectId: string
  projectName: string
  centerCardId: string
  cards: Card[]
  edges: CanvasEdge[]
  updatedAt: string
}

interface StoredState {
  projects: StoredProject[]
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, position: { ...card.position } }))
}

function cloneEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.map((edge) => ({ ...edge }))
}

export function buildDefaultDemoProject(): ProjectSummary {
  const spec = loadSpecCanvas()
  return {
    projectId: DEFAULT_PROJECT_ID,
    projectName: loadSpecProjectName(),
    centerCardId: spec.centerCardId,
    cards: cloneCards(spec.cards),
    edges: cloneEdges(spec.edges),
    updatedAt: new Date().toISOString(),
  }
}

export function enrichDemoProjectIfEmpty(project: ProjectSummary): ProjectSummary {
  if (project.projectId === DEFAULT_PROJECT_ID && project.cards.length === 0) {
    const demo = buildDefaultDemoProject()
    return {
      ...project,
      projectName: demo.projectName,
      centerCardId: demo.centerCardId,
      cards: demo.cards,
      edges: demo.edges,
    }
  }
  return project
}

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as StoredState
    }
  } catch {
    // fall through to seed
  }

  const seeded: StoredState = {
    projects: [buildDefaultDemoProject()],
  }

  writeState(seeded)
  return seeded
}

function writeState(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function toSummary(project: StoredProject): ProjectSummary {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    centerCardId: project.centerCardId,
    cards: cloneCards(project.cards),
    edges: cloneEdges(project.edges),
    updatedAt: project.updatedAt,
  }
}

function toPayload(project: StoredProject): ProjectPayload {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    centerCardId: project.centerCardId,
    cards: cloneCards(project.cards),
    edges: cloneEdges(project.edges),
  }
}

export function listLocalProjects(): ProjectSummary[] {
  const state = readState()
  return [...state.projects]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toSummary)
}

export function getLocalProject(projectId: string): ProjectPayload | null {
  const state = readState()
  const project = state.projects.find((item) => item.projectId === projectId)
  return project ? toPayload(project) : null
}

export function createLocalProject(): ProjectPayload {
  const state = readState()
  const projectId = crypto.randomUUID()
  const now = new Date().toISOString()

  const project: StoredProject = {
    projectId,
    projectName: 'Untitled Project',
    centerCardId: 'product',
    cards: [],
    edges: [],
    updatedAt: now,
  }

  state.projects.unshift(project)
  writeState(state)
  return toPayload(project)
}

export function updateLocalProjectName(projectId: string, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return

  const state = readState()
  const project = state.projects.find((item) => item.projectId === projectId)
  if (!project) return

  project.projectName = trimmed
  project.updatedAt = new Date().toISOString()
  writeState(state)
}

export function syncLocalProjectCanvas(
  projectId: string,
  patch: Pick<ProjectPayload, 'projectName' | 'centerCardId' | 'cards' | 'edges'>,
): void {
  const state = readState()
  const project = state.projects.find((item) => item.projectId === projectId)
  if (!project) return

  project.projectName = patch.projectName
  project.centerCardId = patch.centerCardId
  project.cards = cloneCards(patch.cards)
  project.edges = cloneEdges(patch.edges)
  project.updatedAt = new Date().toISOString()
  writeState(state)
}
