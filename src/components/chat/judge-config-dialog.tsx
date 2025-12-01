import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Settings2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SYNTHESIZER_PROMPTS } from "@/constants/council-prompts"

interface JudgeConfigDialogProps {
    judgePrompt: string
    setJudgePrompt: (prompt: string) => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    defaultPrompt: string
    trigger?: React.ReactNode
}

export function JudgeConfigDialog({
    judgePrompt,
    setJudgePrompt,
    isOpen,
    onOpenChange,
    defaultPrompt,
    trigger
}: JudgeConfigDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Customize Persona
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Judge Persona Configuration</DialogTitle>
                    <DialogDescription>
                        Customize how the Judge synthesizes the Council&apos;s debate.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Template</Label>
                        <Select onValueChange={(val) => {
                            const template = SYNTHESIZER_PROMPTS.find(t => t.id === val);
                            if (template) setJudgePrompt(template.systemPrompt);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SYNTHESIZER_PROMPTS.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        <span className="font-medium">{template.name}</span>
                                        <span className="ml-2 text-muted-foreground text-xs">
                                            - {template.description}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">System Prompt</Label>
                        <Textarea
                            id="prompt"
                            value={judgePrompt}
                            onChange={(e) => setJudgePrompt(e.target.value)}
                            className="h-[300px] font-mono text-xs"
                            placeholder="Enter system prompt..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to use the default synthesis prompt.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setJudgePrompt(defaultPrompt)}>Reset to Default</Button>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
