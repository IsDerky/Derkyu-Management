"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ListItem {
  id: string
  text: string
  checked: boolean
}

interface ListNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export function ListNoteEditor({ value, onChange }: ListNoteEditorProps) {
  const [items, setItems] = useState<ListItem[]>([])
  const [newItemText, setNewItemText] = useState("")

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        setItems(parsed)
      } catch {
        // Si no es JSON válido, convertir texto plano a items
        const lines = value.split('\n').filter(line => line.trim())
        const newItems = lines.map((line, index) => ({
          id: `item-${index}`,
          text: line,
          checked: false
        }))
        setItems(newItems)
      }
    }
  }, [])

  // Update parent when items change
  useEffect(() => {
    if (items.length > 0) {
      onChange(JSON.stringify(items))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const addItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (newItemText.trim()) {
        const newItem: ListItem = {
          id: `item-${Date.now()}`,
          text: newItemText.trim(),
          checked: false
        }
        setItems([...items, newItem])
        setNewItemText("")
      }
    }
  }

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Separar items marcados y no marcados
  const uncheckedItems = items.filter(item => !item.checked)
  const checkedItems = items.filter(item => item.checked)
  const sortedItems = [...uncheckedItems, ...checkedItems]

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 group"
        >
          <Checkbox
            checked={item.checked}
            onCheckedChange={() => toggleItem(item.id)}
          />
          <span className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
            {item.text}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteItem(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <input
        type="text"
        placeholder="Escribe un item y presiona Enter..."
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        onKeyDown={addItem}
        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
