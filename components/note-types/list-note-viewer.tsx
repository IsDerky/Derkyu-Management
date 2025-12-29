"use client"

import { Checkbox } from "@/components/ui/checkbox"

interface ListItem {
  id: string
  text: string
  checked: boolean
}

interface ListNoteViewerProps {
  content: string
  onUpdate?: (content: string) => void
}

export function ListNoteViewer({ content, onUpdate }: ListNoteViewerProps) {
  let items: ListItem[] = []

  try {
    items = JSON.parse(content)
  } catch {
    // Si no es JSON, mostrar como texto plano
    return <p className="text-sm text-muted-foreground">{content}</p>
  }

  const toggleItem = (id: string) => {
    if (!onUpdate) return

    const updatedItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    onUpdate(JSON.stringify(updatedItems))
  }

  // Separar items marcados y no marcados
  const uncheckedItems = items.filter(item => !item.checked)
  const checkedItems = items.filter(item => item.checked)
  const sortedItems = [...uncheckedItems, ...checkedItems]

  return (
    <div className="space-y-1.5">
      {sortedItems.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2"
        >
          <Checkbox
            checked={item.checked}
            onCheckedChange={() => toggleItem(item.id)}
            disabled={!onUpdate}
          />
          <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
            {item.text}
          </span>
        </div>
      ))}
      {items.length > 5 && (
        <p className="text-xs text-muted-foreground pl-6">
          +{items.length - 5} más...
        </p>
      )}
    </div>
  )
}
