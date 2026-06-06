/** Human-layer card synthesis for execution planning — title/body from canvas cards. */

export interface CardSynthesisEntry {
  id: string
  type: string
  title: string
  body: string
  file: string
  anchor?: string
  status?: string
}

export interface CardSynthesisBundle {
  cards: CardSynthesisEntry[]
  byFile: Record<string, CardSynthesisEntry[]>
}

export interface CardSynthesisInput {
  id: string
  type: string
  title: string
  body: string
  specRef: { file: string; anchor?: string }
  status?: string
}

/** Build human-layer synthesis grouped by spec file. Skips index hub cards. */
export function buildCardSynthesis(cards: CardSynthesisInput[]): CardSynthesisBundle {
  const entries: CardSynthesisEntry[] = []

  for (const card of cards) {
    if (card.type === 'index') continue
    const file = card.specRef.file
    if (!file) continue

    entries.push({
      id: card.id,
      type: card.type,
      title: card.title.trim(),
      body: card.body.trim(),
      file,
      anchor: card.specRef.anchor,
      status: card.status,
    })
  }

  const byFile: Record<string, CardSynthesisEntry[]> = {}
  for (const entry of entries) {
    const list = byFile[entry.file] ?? []
    list.push(entry)
    byFile[entry.file] = list
  }

  return { cards: entries, byFile }
}

export interface ExecutionPlanInput {
  spec: Record<string, string>
  synthesis: CardSynthesisBundle
  projectName?: string
}
