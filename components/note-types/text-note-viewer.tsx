"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TextNoteViewerProps {
  content: string
}

export function TextNoteViewer({ content }: TextNoteViewerProps) {
  if (!content) {
    return <p className="text-sm text-muted-foreground">Sin contenido</p>
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
