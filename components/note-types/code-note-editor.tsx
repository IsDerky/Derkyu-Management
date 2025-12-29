"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CodeNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

interface CodeContent {
  code: string
  language: string
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "r", label: "R" },
  { value: "matlab", label: "MATLAB" },
  { value: "dart", label: "Dart" },
  { value: "lua", label: "Lua" },
  { value: "perl", label: "Perl" },
]

export function CodeNoteEditor({ value, onChange }: CodeNoteEditorProps) {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [open, setOpen] = useState(false)

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed: CodeContent = JSON.parse(value)
        setCode(parsed.code)
        setLanguage(parsed.language || "javascript")
      } catch {
        setCode(value)
      }
    }
  }, [])

  // Update parent when code or language changes
  useEffect(() => {
    if (code || language !== "javascript") {
      const content: CodeContent = { code, language }
      onChange(JSON.stringify(content))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language])

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="language-select">Lenguaje de programación</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {language
                ? LANGUAGES.find((lang) => lang.value === language)?.label
                : "Selecciona un lenguaje..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar lenguaje..." />
              <CommandList>
                <CommandEmpty>No se encontró el lenguaje.</CommandEmpty>
                <CommandGroup>
                  {LANGUAGES.map((lang) => (
                    <CommandItem
                      key={lang.value}
                      value={lang.value}
                      onSelect={(currentValue) => {
                        setLanguage(currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          language === lang.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {lang.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code-input">Código</Label>
        <Textarea
          id="code-input"
          placeholder="Escribe tu código aquí..."
          rows={15}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
    </div>
  )
}