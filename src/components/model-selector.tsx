'use client';

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Model {
  id: string
  name: string
  provider: string
}

export const POPULAR_MODELS: Model[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'openai/o1-preview', name: 'o1 Preview', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
]

import { Edit2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PersonaEditorDialog } from '@/components/chat/persona-editor-dialog';

export interface CouncilMember {
  modelId: string
  persona?: string
}

interface ModelSelectorProps {
  value?: string | string[] | CouncilMember[]
  onValueChange: (value: any) => void
  mode?: 'single' | 'multiple'
  className?: string
}

export function ModelSelector({
  value,
  onValueChange,
  mode = 'single',
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [customModel, setCustomModel] = React.useState("")

  // Persona Editing State
  const [editingMember, setEditingMember] = React.useState<CouncilMember | null>(null)
  const [personaInput, setPersonaInput] = React.useState("")

  // Normalize value to array of IDs for selection logic
  const selectedIds = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) {
      return (value as any[]).map(v => typeof v === 'string' ? v : v.modelId)
    }
    return [typeof value === 'string' ? value : (value as any).modelId]
  }, [value])

  // Helper to get full member object if it exists
  const getMember = (id: string): CouncilMember | undefined => {
    if (Array.isArray(value)) {
      return (value as any[]).find(v => (typeof v === 'string' ? v : v.modelId) === id)
        ? (typeof (value as any[]).find(v => (typeof v === 'string' ? v : v.modelId) === id) === 'string'
          ? { modelId: id }
          : (value as any[]).find(v => v.modelId === id))
        : undefined
    }
    return undefined
  }

  const handleSelect = (currentValue: string) => {
    if (mode === 'single') {
      onValueChange(currentValue === (value as string) ? "" : currentValue)
      setOpen(false)
    } else {
      // Multiple Mode Logic
      const currentMembers = (value as any[]) || []
      const exists = currentMembers.some(m => (typeof m === 'string' ? m : m.modelId) === currentValue)

      let newMembers
      if (exists) {
        newMembers = currentMembers.filter(m => (typeof m === 'string' ? m : m.modelId) !== currentValue)
      } else {
        newMembers = [...currentMembers, { modelId: currentValue }]
      }
      onValueChange(newMembers)
    }
  }

  const handleEditPersona = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const member = getMember(memberId)
    if (member) {
      setEditingMember(member)
      setPersonaInput(member.persona || "")
    }
  }

  const savePersona = () => {
    if (!editingMember) return

    const currentMembers = (value as any[]) || []
    const newMembers = currentMembers.map(m => {
      const id = typeof m === 'string' ? m : m.modelId
      if (id === editingMember.modelId) {
        return { modelId: id, persona: personaInput }
      }
      return m
    })

    onValueChange(newMembers)
    setEditingMember(null)
  }

  const getModelName = (id: string) => {
    const model = POPULAR_MODELS.find(m => m.id === id)
    return model ? model.name : id
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-mono text-xs h-10 rounded-none"
          >
            {mode === 'single'
              ? (selectedIds.length > 0 ? getModelName(selectedIds[0]) : "Select model...")
              : (selectedIds.length > 0 ? `${selectedIds.length} models selected` : "Select models...")
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 rounded-none" align="start">
          <Command className="rounded-none">
            <CommandInput placeholder="Search models..." className="font-mono text-xs" />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-xs font-mono">
                  <p className="mb-2">No preset found.</p>
                  <div className="flex items-center gap-2">
                    <input
                      className="flex h-8 w-full rounded-none border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter custom ID (e.g. provider/model)"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customModel) {
                          handleSelect(customModel)
                          setCustomModel("")
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 rounded-none"
                      onClick={() => {
                        if (customModel) {
                          handleSelect(customModel)
                          setCustomModel("")
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CommandEmpty>
              {['Anthropic', 'OpenAI', 'Google', 'Other'].map(provider => (
                <CommandGroup key={provider} heading={provider === 'Other' ? 'Open Source / Others' : provider}>
                  {POPULAR_MODELS.filter(m => provider === 'Other' ? !['Anthropic', 'OpenAI', 'Google'].includes(m.provider) : m.provider === provider).map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      keywords={[model.name, model.provider]}
                      onSelect={handleSelect}
                      className="font-mono text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(model.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {model.name}
                      <span className="ml-auto text-muted-foreground opacity-50">{model.id}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tags Display for Multiple Mode */}
      {mode === 'multiple' && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedIds.map(id => {
            const model = POPULAR_MODELS.find(m => m.id === id);
            const member = getMember(id);
            const hasPersona = member?.persona && member.persona.trim().length > 0;

            return (
              <Badge key={id} variant="secondary" className={cn("rounded-none font-mono font-normal text-xs pr-1 pl-2 py-1 flex items-center gap-1", hasPersona && "border-primary/50 bg-primary/5")}>
                <span>{model ? model.name : id}</span>
                {hasPersona && <span className="text-[9px] text-primary ml-1 font-bold" title={member.persona}>(P)</span>}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleEditPersona(id, e)}
                  title="Edit Persona"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => handleSelect(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Persona Editor Dialog */}
      <PersonaEditorDialog
        isOpen={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        modelName={editingMember ? getModelName(editingMember.modelId) : ''}
        persona={personaInput}
        setPersona={setPersonaInput}
        onSave={savePersona}
      />
    </div>
  )
}
