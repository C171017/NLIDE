import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownTableVizProps {
  source: string
}

export default function MarkdownTableViz({ source }: MarkdownTableVizProps) {
  return (
    <div className="glass-surface overflow-auto rounded-2xl p-3 text-xs [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-white/10 [&_th]:bg-slate-950/45 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  )
}
