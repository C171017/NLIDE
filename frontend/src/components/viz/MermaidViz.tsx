import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
})

interface MermaidVizProps {
  source: string
  compact?: boolean
}

export default function MermaidViz({ source, compact = false }: MermaidVizProps) {
  const reactId = useId()
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const id = `mermaid-${reactId.replace(/:/g, '')}`
        const { svg: rendered } = await mermaid.render(id, source)
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    void render()

    return () => {
      cancelled = true
    }
  }, [reactId, source])

  if (error) {
    return (
      <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
        {error}
      </div>
    )
  }

  return (
    <div
      className={`overflow-auto rounded-md border border-[#2d3348] bg-[#141824] ${compact ? 'max-h-36 p-2' : 'p-3'}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
