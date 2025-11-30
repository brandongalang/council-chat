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
import { Input } from "@/components/ui/input"
import { Save } from 'lucide-react'

interface PresetSaveDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    presetName: string
    setPresetName: (name: string) => void
    onSave: () => void
}

export function PresetSaveDialog({
    isOpen,
    onOpenChange,
    presetName,
    setPresetName,
    onSave
}: PresetSaveDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Save className="h-3 w-3" />
                    Save
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Council Preset</DialogTitle>
                    <DialogDescription>
                        Save the current configuration (Members + Judge) as a reusable preset.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Coding Team"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onSave}>Save Preset</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
