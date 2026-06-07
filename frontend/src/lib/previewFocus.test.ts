import { describe, expect, it } from 'vitest'
import {
  resolveCommitSelectionCardId,
  resolvePreviewFocusCardId,
} from './previewFocus'
import type { Card, PreviewPayload } from '../types/canvas'

const committedCards: Card[] = [
  {
    id: 'F-001',
    specRef: { file: 'features.md', anchor: 'F-001' },
    type: 'feature',
    title: 'Existing feature',
    body: 'Original body',
    position: { x: 0, y: 0 },
    layer: 0,
  },
  {
    id: 'product',
    specRef: { file: 'product.md' },
    type: 'product',
    title: 'Product',
    body: 'Hub',
    position: { x: 0, y: 0 },
    layer: 0,
  },
]

function previewWith(cards: Card[], patches: PreviewPayload['mdPatches'], focusCardId?: string): PreviewPayload {
  return {
    previewId: 'preview-test',
    cards,
    edges: [],
    mdPatches: patches,
    summary: 'Test preview',
    focusCardId,
  }
}

describe('resolvePreviewFocusCardId', () => {
  it('prefers update targets over new cards', () => {
    const preview = previewWith(
      [
        ...committedCards,
        {
          id: 'F-002',
          specRef: { file: 'features.md', anchor: 'F-002' },
          type: 'feature',
          title: 'New feature',
          body: 'New',
          position: { x: 0, y: 0 },
          layer: 0,
        },
      ],
      [{ file: 'features.md', action: 'update', anchor: 'F-001', summary: 'Update F-001' }],
      'F-002',
    )

    expect(resolvePreviewFocusCardId(preview, committedCards)).toBe('F-001')
  })

  it('focuses explicit focusCardId for compound new-card previews', () => {
    const preview = previewWith(
      [
        ...committedCards,
        {
          id: 'F-007',
          specRef: { file: 'features.md', anchor: 'F-007' },
          type: 'feature',
          title: 'First',
          body: 'First',
          position: { x: 0, y: 0 },
          layer: 0,
        },
        {
          id: 'D-004',
          specRef: { file: 'decisions.md', anchor: 'D-004' },
          type: 'decision',
          title: 'Last',
          body: 'Last',
          position: { x: 0, y: 0 },
          layer: 0,
        },
      ],
      [],
      'D-004',
    )

    expect(resolvePreviewFocusCardId(preview, committedCards)).toBe('D-004')
  })

  it('falls back to last new card when focusCardId is absent', () => {
    const preview = previewWith(
      [
        ...committedCards,
        {
          id: 'F-007',
          specRef: { file: 'features.md', anchor: 'F-007' },
          type: 'feature',
          title: 'First',
          body: 'First',
          position: { x: 0, y: 0 },
          layer: 0,
        },
        {
          id: 'C-004',
          specRef: { file: 'constraints.md', anchor: 'C-004' },
          type: 'constraint',
          title: 'Last',
          body: 'Last',
          position: { x: 0, y: 0 },
          layer: 0,
        },
      ],
      [],
    )

    expect(resolvePreviewFocusCardId(preview, committedCards)).toBe('C-004')
  })
})

describe('resolveCommitSelectionCardId', () => {
  it('selects last new overview entity after commit', () => {
    const preview = previewWith(
      [
        ...committedCards,
        {
          id: 'F-007',
          specRef: { file: 'features.md', anchor: 'F-007' },
          type: 'feature',
          title: 'First',
          body: 'First',
          position: { x: 0, y: 0 },
          layer: 0,
        },
        {
          id: 'D-004',
          specRef: { file: 'decisions.md', anchor: 'D-004' },
          type: 'decision',
          title: 'Last',
          body: 'Last',
          position: { x: 0, y: 0 },
          layer: 0,
        },
      ],
      [],
      'D-004',
    )

    expect(resolveCommitSelectionCardId(preview, committedCards)).toBe('D-004')
  })
})
