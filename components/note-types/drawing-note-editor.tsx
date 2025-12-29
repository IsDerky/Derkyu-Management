"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Palette } from "lucide-react"

interface DrawingNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export function DrawingNoteEditor({ value, onChange }: DrawingNoteEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(2)

  const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Cargar dibujo existente
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    } else {
      // Fondo blanco inicial
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Guardar el dibujo
    const dataUrl = canvas.toDataURL()
    onChange(dataUrl)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-primary' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Tamaño:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm">{brushSize}px</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="border rounded-lg cursor-crosshair bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  )
}
