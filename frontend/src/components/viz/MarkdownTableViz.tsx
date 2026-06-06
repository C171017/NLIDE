import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownTableVizProps {
  source: string
}

export default function MarkdownTableViz({ source }: MarkdownTableVizProps) {
  return (
    <div className="overflow-auto rounded-md border border-[#2d3348] bg-[#141824] p-3 text-xs [&_table]:w-full [&_td]:border [&_td]:border-[#2d3348] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[#2d3348] [&_th]:bg-[#1a1d27] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  )
}
