"use client"

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Badge } from "@/components/ui/badge"

interface CodeNoteViewerProps {
  content: string
}

interface CodeContent {
  code: string
  language: string
}

export function CodeNoteViewer({ content }: CodeNoteViewerProps) {
  let codeContent: CodeContent = { code: "", language: "javascript" }

  try {
    codeContent = JSON.parse(content)
  } catch {
    codeContent = { code: content, language: "javascript" }
  }

  if (!codeContent.code) {
    return <p className="text-sm text-muted-foreground">Sin código</p>
  }

  // Limitar preview a las primeras 5 líneas
  const lines = codeContent.code.split('\n')
  const previewCode = lines.slice(0, 5).join('\n')
  const hasMore = lines.length > 5

  return (
    <div className="space-y-2">
      <Badge variant="secondary" className="text-xs">
        {codeContent.language}
      </Badge>
      <div className="relative">
        <SyntaxHighlighter
          language={codeContent.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            maxHeight: '200px',
          }}
        >
          {previewCode}
        </SyntaxHighlighter>
        {hasMore && (
          <p className="text-xs text-muted-foreground mt-1">
            +{lines.length - 5} líneas más...
          </p>
        )}
      </div>
    </div>
  )
}
