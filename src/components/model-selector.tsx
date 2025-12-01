'use client';

import * as React from "react"
import { Check, ChevronsUpDown, X, Loader2, Plus } from "lucide-react"
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
import { Edit2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PersonaEditorDialog } from '@/components/chat/persona-editor-dialog';

/**
 * Definition of a Model interface.
 */
export interface Model {
  /** Unique identifier for the model. */
  id: string
  /** Display name of the model. */
  name: string
  /** Provider of the model (e.g. OpenAI). */
  provider: string
}

/**
 * List of popular models available for selection (fallback).
 */
export const POPULAR_MODELS: Model[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'openai/o1-preview', name: 'o1 Preview', provider: 'openai' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'google' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'meta-llama' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'meta-llama' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'mistralai' },
]

/**
 * Represents a member of a Council, including model ID, unique instance ID, and optional persona.
 */
export interface CouncilMember {
  /** Unique instance ID for this council member (allows same model multiple times) */
  instanceId: string
  /** The model ID (e.g. openai/gpt-4o) */
  modelId: string
  /** Optional persona/system prompt for this member */
  persona?: string
}

/** Generate a unique instance ID */
const generateInstanceId = () => `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Props for the ModelSelector component.
 */
interface ModelSelectorProps {
  /** The currently selected value(s). Can be a string, array of strings, or array of CouncilMembers. */
  value?: string | string[] | CouncilMember[]
  /** Callback triggered when selection changes. */
  onValueChange: (value: any) => void
  /** Selection mode: 'single' or 'multiple'. */
  mode?: 'single' | 'multiple'
  /** Optional class name for styling. */
  className?: string
}

/**
 * Component for selecting AI models from a list or entering a custom one.
 * Supports single and multiple selection modes, and persona editing for council members.
 * In multiple mode, the same model can be added multiple times with different personas.
 *
 * @param props - The properties for the Model Selector.
 * @returns The rendered Model Selector component.
 */
export function ModelSelector({
  value,
  onValueChange,
  mode = 'single',
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [customModel, setCustomModel] = React.useState("")
  const [allModels, setAllModels] = React.useState<Model[]>(POPULAR_MODELS)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasFetched, setHasFetched] = React.useState(false)

  // Persona Editing State - now tracks by instanceId
  const [editingMember, setEditingMember] = React.useState<CouncilMember | null>(null)
  const [personaInput, setPersonaInput] = React.useState("")

  // Fetch all models when popover opens
  React.useEffect(() => {
    if (open && !hasFetched) {
      setIsLoading(true)
      fetch('/api/models')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllModels(data)
          }
          setHasFetched(true)
        })
        .catch(err => {
          console.error('Failed to fetch models:', err)
        })
        .finally(() => setIsLoading(false))
    }
  }, [open, hasFetched])

  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const groups: Record<string, Model[]> = {}
    allModels.forEach(model => {
      const provider = model.provider || 'other'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })
    const priorityProviders = ['openai', 'anthropic', 'google', 'meta-llama', 'mistralai']
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIndex = priorityProviders.indexOf(a.toLowerCase())
      const bIndex = priorityProviders.indexOf(b.toLowerCase())
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })
    return { groups, sortedKeys }
  }, [allModels])

  // Normalize value to array of CouncilMembers
  const members = React.useMemo((): CouncilMember[] => {
    if (!value) return []
    if (Array.isArray(value)) {
      return (value as any[]).map(v => {
        if (typeof v === 'string') {
          return { instanceId: generateInstanceId(), modelId: v }
        }
        // Ensure instanceId exists
        return v.instanceId ? v : { ...v, instanceId: generateInstanceId() }
      })
    }
    if (typeof value === 'string') {
      return [{ instanceId: generateInstanceId(), modelId: value }]
    }
    return []
  }, [value])

  // Get member by instanceId
  const getMemberByInstanceId = (instanceId: string): CouncilMember | undefined => {
    return members.find(m => m.instanceId === instanceId)
  }

  const handleSelect = (modelId: string) => {
    if (mode === 'single') {
      onValueChange(modelId === (value as string) ? "" : modelId)
      setOpen(false)
    } else {
      // Multiple Mode: Always ADD a new member (allows duplicates)
      const newMember: CouncilMember = {
        instanceId: generateInstanceId(),
        modelId: modelId,
      }
      const currentMembers = Array.isArray(value) ? [...value as CouncilMember[]] : []
      onValueChange([...currentMembers, newMember])
    }
  }

  const handleRemoveMember = (instanceId: string) => {
    if (mode === 'multiple' && Array.isArray(value)) {
      const newMembers = (value as CouncilMember[]).filter(m => m.instanceId !== instanceId)
      onValueChange(newMembers)
    }
  }

  const handleEditPersona = (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const member = getMemberByInstanceId(instanceId)
    if (member) {
      setEditingMember(member)
      setPersonaInput(member.persona || "")
    }
  }

  const savePersona = () => {
    if (!editingMember || !Array.isArray(value)) return

    const newMembers = (value as CouncilMember[]).map(m => {
      if (m.instanceId === editingMember.instanceId) {
        return { ...m, persona: personaInput }
      }
      return m
    })

    onValueChange(newMembers)
    setEditingMember(null)
  }

  const getModelName = (id: string) => {
    const model = allModels.find(m => m.id === id) || POPULAR_MODELS.find(m => m.id === id)
    return model ? model.name : id
  }

  const formatProviderName = (provider: string) => {
    const nameMap: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'meta-llama': 'Meta Llama',
      'mistralai': 'Mistral AI',
      'cohere': 'Cohere',
      'perplexity': 'Perplexity',
      'deepseek': 'DeepSeek',
      'x-ai': 'xAI',
    }
    return nameMap[provider.toLowerCase()] || provider.charAt(0).toUpperCase() + provider.slice(1)
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
              ? (value ? getModelName(value as string) : "Select model...")
              : (members.length > 0 ? `${members.length} model${members.length > 1 ? 's' : ''} in council` : "Add models to council...")
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] p-0 rounded-none border-border" 
          align="start"
          style={{ backgroundColor: 'hsl(var(--popover))' }}
        >
          <Command className="rounded-none" style={{ backgroundColor: 'hsl(var(--popover))' }}>
            <CommandInput placeholder="Search all OpenRouter models..." className="font-mono text-xs" />
            <CommandList className="max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-xs font-mono">Loading models...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="p-2 text-xs font-mono">
                      <p className="mb-2">No model found.</p>
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
                  {modelsByProvider.sortedKeys.map(provider => (
                    <CommandGroup key={provider} heading={formatProviderName(provider)}>
                      {modelsByProvider.groups[provider].map((model) => (
                        <CommandItem
                          key={model.id}
                          value={model.id}
                          keywords={[model.name, model.provider, model.id]}
                          onSelect={handleSelect}
                          className="font-mono text-xs"
                        >
                          {mode === 'single' ? (
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 flex-shrink-0",
                                value === model.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          ) : (
                            <Plus className="mr-2 h-4 w-4 flex-shrink-0 opacity-50" />
                          )}
                          <span className="truncate">{model.name}</span>
                          <span className="ml-auto text-muted-foreground opacity-50 text-[10px] truncate max-w-[150px]">{model.id}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Members Display for Multiple Mode */}
      {mode === 'multiple' && members.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {members.map((member, index) => {
            const model = allModels.find(m => m.id === member.modelId) || POPULAR_MODELS.find(m => m.id === member.modelId);
            const hasPersona = member.persona && member.persona.trim().length > 0;

            return (
              <Badge 
                key={member.instanceId} 
                variant="secondary" 
                className={cn(
                  "rounded-none font-mono font-normal text-xs pr-1 pl-2 py-1 flex items-center gap-1",
                  hasPersona && "border-primary/50 bg-primary/5"
                )}
              >
                <span className="text-muted-foreground text-[10px] mr-1">#{index + 1}</span>
                <span>{model ? model.name : member.modelId}</span>
                {hasPersona && <span className="text-[9px] text-primary ml-1 font-bold" title={member.persona}>(P)</span>}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={(e) => handleEditPersona(member.instanceId, e)}
                  title="Edit Persona"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveMember(member.instanceId)}
                  title="Remove from council"
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
