import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PersonaEditorDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    modelName: string
    persona: string
    setPersona: (persona: string) => void
    onSave: () => void
}

export function PersonaEditorDialog({
    isOpen,
    onOpenChange,
    modelName,
    persona,
    setPersona,
    onSave
}: PersonaEditorDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Persona</DialogTitle>
                    <DialogDescription>
                        Customize the system prompt for {modelName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="persona">System Prompt Override</Label>
                        <Textarea
                            id="persona"
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className="h-[200px] font-mono text-xs"
                            placeholder="You are a skeptical critic..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onSave}>Save Persona</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
