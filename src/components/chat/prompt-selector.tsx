import * as React from "react"
import { Check, ChevronsUpDown, Info } from "lucide-react"
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { PromptTemplate } from "@/constants/council-prompts"
import { Badge } from "@/components/ui/badge"

interface PromptSelectorProps {
    value?: string
    onValueChange: (value: string) => void
    prompts: PromptTemplate[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function PromptSelector({
    value,
    onValueChange,
    prompts,
    placeholder = "Select prompt...",
    className,
    disabled = false
}: PromptSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const selectedPrompt = prompts.find((prompt) => prompt.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedPrompt?.icon && <span>{selectedPrompt.icon}</span>}
                        <span className="truncate">{selectedPrompt?.name || placeholder}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search prompts..." />
                    <CommandList>
                        <CommandEmpty>No prompt found.</CommandEmpty>
                        <CommandGroup>
                            {prompts.map((prompt) => (
                                <CommandItem
                                    key={prompt.id}
                                    value={prompt.name}
                                    onSelect={() => {
                                        onValueChange(prompt.id === value ? "" : prompt.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === prompt.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span>{prompt.icon}</span>
                                            <span className="font-medium">{prompt.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {prompt.description}
                                        </span>
                                        {prompt.tags && prompt.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {prompt.tags.slice(0, 2).map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {prompt.systemPrompt && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="ml-auto p-1 hover:bg-muted rounded cursor-help" onClick={(e) => e.stopPropagation()}>
                                                        <Info className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="max-w-[300px] text-xs">
                                                    <p className="font-semibold mb-1">System Prompt:</p>
                                                    <p className="whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                                        {prompt.systemPrompt}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
