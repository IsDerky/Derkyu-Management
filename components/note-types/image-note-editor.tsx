"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export function ImageNoteEditor({ value, onChange }: ImageNoteEditorProps) {
  const [imageUrl, setImageUrl] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value && !imageUrl) {
      setImageUrl(value)
    }
  }, [value])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. El tamaño máximo es 5MB')
      return
    }

    // Convertir a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImageUrl(base64)
      onChange(base64)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageUrl("")
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!imageUrl ? (
        <div
          onClick={triggerFileInput}
          className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
        >
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Haz clic para subir una imagen
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF hasta 5MB
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="relative w-full h-96 rounded-lg overflow-hidden border">
            <Image
              src={imageUrl}
              alt="Imagen de nota"
              fill
              className="object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
