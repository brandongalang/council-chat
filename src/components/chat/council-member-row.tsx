import * as React from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelSelector } from "@/components/model-selector"
import { PromptSelector } from "@/components/chat/prompt-selector"
import { CouncilMember } from "@/types/council"
import { COUNCIL_MEMBER_PROMPTS } from "@/constants/council-prompts"

interface CouncilMemberRowProps {
    member: CouncilMember
    index: number
    onUpdate: (index: number, updates: Partial<CouncilMember>) => void
    onRemove: (index: number) => void
    showRemove?: boolean
}

export function CouncilMemberRow({
    member,
    index,
    onUpdate,
    onRemove,
    showRemove = true
}: CouncilMemberRowProps) {
    return (
        <div className="flex items-start gap-2 p-2 rounded-md border bg-card/50 hover:bg-card transition-colors group">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                        #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                        <ModelSelector
                            mode="single"
                            value={member.modelId}
                            onValueChange={(val) => onUpdate(index, { modelId: val as string })}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-6 shrink-0" /> {/* Spacer for alignment */}
                    <div className="flex-1 min-w-0">
                        <PromptSelector
                            value={member.promptTemplateId}
                            onValueChange={(val) => onUpdate(index, { promptTemplateId: val })}
                            prompts={COUNCIL_MEMBER_PROMPTS}
                            placeholder="Select Persona..."
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>

            {showRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
