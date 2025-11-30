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

interface ModelSelectorProps {
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
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

  const selectedValues = Array.isArray(value) ? value : (value ? [value] : [])

  const handleSelect = (currentValue: string) => {
    if (mode === 'single') {
      onValueChange(currentValue === value ? "" : currentValue)
      setOpen(false)
    } else {
      const newValues = selectedValues.includes(currentValue)
        ? selectedValues.filter((v) => v !== currentValue)
        : [...selectedValues, currentValue]
      onValueChange(newValues)
    }
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
              ? (selectedValues.length > 0 ? getModelName(selectedValues[0]) : "Select model...")
              : (selectedValues.length > 0 ? `${selectedValues.length} models selected` : "Select models...")
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
              <CommandGroup heading="Anthropic">
                {POPULAR_MODELS.filter(m => m.provider === 'Anthropic').map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id} // Search by ID
                    keywords={[model.name, model.provider]}
                    onSelect={handleSelect}
                    className="font-mono text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(model.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model.name}
                    <span className="ml-auto text-muted-foreground opacity-50">{model.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="OpenAI">
                {POPULAR_MODELS.filter(m => m.provider === 'OpenAI').map((model) => (
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
                        selectedValues.includes(model.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model.name}
                    <span className="ml-auto text-muted-foreground opacity-50">{model.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Google">
                {POPULAR_MODELS.filter(m => m.provider === 'Google').map((model) => (
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
                        selectedValues.includes(model.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model.name}
                    <span className="ml-auto text-muted-foreground opacity-50">{model.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Open Source / Others">
                {POPULAR_MODELS.filter(m => !['Anthropic', 'OpenAI', 'Google'].includes(m.provider)).map((model) => (
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
                        selectedValues.includes(model.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model.name}
                    <span className="ml-auto text-muted-foreground opacity-50">{model.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tags Display for Multiple Mode */}
      {mode === 'multiple' && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedValues.map(val => {
            const model = POPULAR_MODELS.find(m => m.id === val);
            return (
              <Badge key={val} variant="secondary" className="rounded-none font-mono font-normal text-xs pr-1">
                {model ? model.name : val}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => handleSelect(val)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
