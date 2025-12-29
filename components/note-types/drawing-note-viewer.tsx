"use client"

import Image from "next/image"

interface DrawingNoteViewerProps {
  content: string
}

export function DrawingNoteViewer({ content }: DrawingNoteViewerProps) {
  if (!content) {
    return <p className="text-sm text-muted-foreground">Sin dibujo</p>
  }

  return (
    <div className="relative w-full h-40 bg-white rounded-lg overflow-hidden border">
      <Image
        src={content}
        alt="Dibujo"
        fill
        className="object-contain"
      />
    </div>
  )
}
