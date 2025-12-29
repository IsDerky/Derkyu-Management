"use client"

import Image from "next/image"

interface ImageNoteViewerProps {
  content: string
}

export function ImageNoteViewer({ content }: ImageNoteViewerProps) {
  if (!content) {
    return <p className="text-sm text-muted-foreground">Sin imagen</p>
  }

  return (
    <div className="relative w-full h-48 bg-secondary/50 rounded-lg overflow-hidden border">
      <Image
        src={content}
        alt="Imagen"
        fill
        className="object-contain"
      />
    </div>
  )
}
