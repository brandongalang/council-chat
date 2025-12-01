'use client';

import * as React from "react"
import { Check, ChevronsUpDown, X, Loader2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { Badge } from "@/components/ui/badge"
import { Edit2 } from "lucide-react"
import { PersonaEditorDialog } from '@/components/chat/persona-editor-dialog';

export interface Model {
  id: string
  name: string
  provider: string
  pricing?: {
    prompt: number
    completion: number
  }
  context_length?: number
}

export interface CouncilMember {
  modelId: string
  persona?: string
}

interface ModelSelectorProps {
  value?: string | string[] | CouncilMember[]
  onValueChange: (value: any) => void
  mode?: 'single' | 'multiple'
  className?: string
  showCouncilOption?: boolean
  onCouncilSelect?: () => void
}

export function ModelSelector({
  value,
  onValueChange,
  mode = 'single',
  className,
  showCouncilOption = false,
  onCouncilSelect,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [customModel, setCustomModel] = React.useState("")
  const [models, setModels] = React.useState<Model[]>([])
  const [savedModels, setSavedModels] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  // Persona Editing State
  const [editingMember, setEditingMember] = React.useState<CouncilMember | null>(null)
  const [personaInput, setPersonaInput] = React.useState("")

  const [providerFilter, setProviderFilter] = React.useState<string>('all')

  // Fetch models on mount
  React.useEffect(() => {
    const fetchModels = async () => {
      setLoading(true)
      try {
        const [modelsRes, savedRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/settings/models')
        ])

        if (modelsRes.ok) {
          const data = await modelsRes.json()
          // Map OpenRouter data to our Model interface
          const mappedModels: Model[] = data.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            provider: m.id.split('/')[0] || 'Other', // Simple provider extraction
            pricing: {
              prompt: parseFloat(m.pricing.prompt) * 1000000,
              completion: parseFloat(m.pricing.completion) * 1000000,
            },
            context_length: m.context_length
          })).sort((a: Model, b: Model) => a.name.localeCompare(b.name))

          setModels(mappedModels)
        }

        if (savedRes.ok) {
          const savedData = await savedRes.json()
          setSavedModels(savedData.map((m: any) => m.model_id))
        }
      } catch (error) {
        console.error("Error fetching models:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

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
      const found = (value as any[]).find(v => (typeof v === 'string' ? v : v.modelId) === id)
      if (!found) return undefined
      return typeof found === 'string' ? { modelId: id } : found
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
    const model = models.find(m => m.id === id)
    return model ? model.name : id
  }

  // Group models by provider
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, Model[]> = {}
    models.forEach(model => {
      const provider = model.provider
      // Filter logic
      if (providerFilter !== 'all' && provider !== providerFilter) return;

      if (!groups[provider]) groups[provider] = []
      groups[provider].push(model)
    })
    return groups
  }, [models, providerFilter])

  // Filtered Saved Models
  const filteredSavedModels = React.useMemo(() => {
    if (providerFilter === 'all') return savedModels;
    return savedModels.filter(id => {
      const m = models.find(mod => mod.id === id);
      return m?.provider === providerFilter;
    });
  }, [savedModels, models, providerFilter]);

  // Unique Providers for Filter
  const providers = React.useMemo(() => {
    const p = new Set(models.map(m => m.provider));
    return Array.from(p).sort();
  }, [models]);

  const commonProviders = ['openai', 'anthropic', 'google', 'meta-llama', 'mistralai'];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-mono text-xs h-10 rounded-none truncate"
          >
            <span className="truncate">
              {mode === 'single'
                ? (selectedIds.length > 0 ? getModelName(selectedIds[0]) : "Select model...")
                : (selectedIds.length > 0 ? `${selectedIds.length} models selected` : "Select models...")
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 rounded-none bg-popover border border-border shadow-lg" align="start">
          <div className="p-2 border-b border-border flex gap-1 overflow-x-auto no-scrollbar">
            <Button
              variant={providerFilter === 'all' ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[10px] rounded-full px-2"
              onClick={() => setProviderFilter('all')}
            >
              All
            </Button>
            {commonProviders.filter(p => providers.includes(p)).map(p => (
              <Button
                key={p}
                variant={providerFilter === p ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] rounded-full px-2 capitalize"
                onClick={() => setProviderFilter(p)}
              >
                {p.replace('meta-llama', 'Meta').replace('mistralai', 'Mistral')}
              </Button>
            ))}
            {/* Add 'Other' if needed or just rely on search */}
          </div>
          <Command className="rounded-none">
            <CommandInput placeholder="Search models..." className="font-mono text-xs" />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-xs font-mono">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading models...
                    </div>
                  ) : (
                    <>
                      <p className="mb-2">No model found.</p>
                      <div className="flex items-center gap-2">
                        <input
                          className="flex h-8 w-full rounded-none border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter custom ID"
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
                    </>
                  )}
                </div>
              </CommandEmpty>
              {showCouncilOption && providerFilter === 'all' && (
                <CommandGroup heading="Special Modes">
                  <CommandItem
                    value="council_mode_trigger"
                    onSelect={() => {
                      if (onCouncilSelect) onCouncilSelect();
                      setOpen(false);
                    }}
                    className="font-mono text-xs font-bold text-primary"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Council Mode
                  </CommandItem>
                </CommandGroup>
              )}
              {filteredSavedModels.length > 0 && (
                <CommandGroup heading="Saved Models">
                  {filteredSavedModels.map((modelId) => {
                    const model = models.find(m => m.id === modelId)
                    return (
                      <CommandItem
                        key={`saved-${modelId}`}
                        value={modelId}
                        keywords={[model?.name || modelId, model?.provider || 'saved', modelId]}
                        onSelect={handleSelect}
                        className="font-mono text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedIds.includes(modelId) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between">
                            <span>{model?.name || modelId}</span>
                            {model?.pricing && (
                              <span className="text-[10px] text-muted-foreground">
                                ${(model.pricing.prompt + model.pricing.completion).toFixed(2)}/1M
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground opacity-70">
                            <span>{modelId}</span>
                            {model?.context_length && (
                              <>
                                <span>•</span>
                                <span>{Math.round(model.context_length / 1000)}k ctx</span>
                              </>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
              {!loading && Object.entries(groupedModels).map(([provider, providerModels]) => (
                <CommandGroup key={provider} heading={provider}>
                  {providerModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      keywords={[model.name, model.provider, model.id]}
                      onSelect={handleSelect}
                      className="font-mono text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedIds.includes(model.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between">
                          <span>{model.name}</span>
                          {model.pricing && (
                            <span className="text-[10px] text-muted-foreground">
                              ${(model.pricing.prompt + model.pricing.completion).toFixed(2)}/1M
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground opacity-70">
                          <span>{model.id}</span>
                          {model.context_length && (
                            <>
                              <span>•</span>
                              <span>{Math.round(model.context_length / 1000)}k ctx</span>
                            </>
                          )}
                        </div>
                      </div>
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
            const member = getMember(id);
            const hasPersona = member?.persona && member.persona.trim().length > 0;
            const modelName = getModelName(id);

            return (
              <Badge key={id} variant="secondary" className={cn("rounded-none font-mono font-normal text-xs pr-1 pl-2 py-1 flex items-center gap-1 max-w-full", hasPersona && "border-primary/50 bg-primary/5")}>
                <span className="truncate max-w-[150px]" title={modelName}>{modelName}</span>
                {hasPersona && <span className="text-[9px] text-primary ml-1 font-bold shrink-0" title={member.persona}>(P)</span>}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground shrink-0"
                  onClick={(e) => handleEditPersona(id, e)}
                  title="Edit Persona"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-foreground shrink-0"
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
