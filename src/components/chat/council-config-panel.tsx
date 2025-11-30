import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Settings2, Menu, Edit2 } from 'lucide-react'
import { ModelSelector, CouncilMember } from '@/components/model-selector'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChatSidebar } from '@/components/chat-sidebar'
import { JudgeConfigDialog } from './judge-config-dialog'
import { PresetSaveDialog } from './preset-save-dialog'

interface CouncilConfigPanelProps {
    mode: 'solo' | 'council'
    setMode: (mode: 'solo' | 'council') => void
    soloModel: string
    setSoloModel: (model: string) => void
    councilMembers: CouncilMember[]
    setCouncilMembers: (members: CouncilMember[]) => void
    judgeModel: string
    setJudgeModel: (model: string) => void
    judgePrompt: string
    setJudgePrompt: (prompt: string) => void
    defaultJudgePrompt: string
    presets: any[]
    onLoadPreset: (id: string) => void
    onSavePreset: () => void
    presetName: string
    setPresetName: (name: string) => void
    isConfigOpen: boolean
    setIsConfigOpen: (open: boolean) => void
    isSidebarOpen: boolean
    setIsSidebarOpen: (open: boolean) => void
    currentChatId: string | null
    onSelectChat: (id: string) => void
    onNewChat: () => void
    isJudgeConfigOpen: boolean
    setIsJudgeConfigOpen: (open: boolean) => void
    isSaveDialogOpen: boolean
    setIsSaveDialogOpen: (open: boolean) => void
}

export function CouncilConfigPanel({
    mode,
    setMode,
    soloModel,
    setSoloModel,
    councilMembers,
    setCouncilMembers,
    judgeModel,
    setJudgeModel,
    judgePrompt,
    setJudgePrompt,
    defaultJudgePrompt,
    presets,
    onLoadPreset,
    onSavePreset,
    presetName,
    setPresetName,
    isConfigOpen,
    setIsConfigOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    currentChatId,
    onSelectChat,
    onNewChat,
    isJudgeConfigOpen,
    setIsJudgeConfigOpen,
    isSaveDialogOpen,
    setIsSaveDialogOpen
}: CouncilConfigPanelProps) {
    return (
        <div className="border-b bg-background z-10">
            <Collapsible
                open={isConfigOpen}
                onOpenChange={setIsConfigOpen}
                className="w-full"
            >
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-4">
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-8 w-8">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72">
                                <ChatSidebar
                                    currentChatId={currentChatId}
                                    onSelectChat={(id) => {
                                        onSelectChat(id);
                                        setIsSidebarOpen(false);
                                    }}
                                    onNewChat={() => {
                                        onNewChat();
                                        setIsSidebarOpen(false);
                                    }}
                                    className="w-full border-none"
                                />
                            </SheetContent>
                        </Sheet>
                        <h2 className="text-sm font-serif font-medium">Session Settings</h2>
                        <Tabs value={mode} onValueChange={(v: string) => setMode(v as 'solo' | 'council')} className="w-[180px] h-8">
                            <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="solo" className="text-xs font-mono h-6">Solo</TabsTrigger>
                                <TabsTrigger value="council" className="text-xs font-mono h-6">Council</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            <Settings2 className="h-4 w-4" />
                            <span className="sr-only">Toggle Config</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-4 pb-4 space-y-4">
                    {mode === 'solo' ? (
                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">Model</label>
                            <ModelSelector
                                mode="single"
                                value={soloModel}
                                onValueChange={(val) => setSoloModel(val as string)}
                            />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Judge Model</Label>
                                    <JudgeConfigDialog
                                        judgePrompt={judgePrompt}
                                        setJudgePrompt={setJudgePrompt}
                                        isOpen={isJudgeConfigOpen}
                                        onOpenChange={setIsJudgeConfigOpen}
                                        defaultPrompt={defaultJudgePrompt}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground" title="Judge Settings">
                                                <Settings2 className="h-3 w-3" />
                                            </Button>
                                        }
                                    />
                                </div>
                                <ModelSelector
                                    mode="single"
                                    value={judgeModel}
                                    onValueChange={(val) => setJudgeModel(val as string)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Preset Controls */}
                            <div className="md:col-span-2 flex items-center gap-2 mb-2 p-2 bg-muted/30 rounded-md border border-dashed">
                                <div className="flex-1">
                                    <Select onValueChange={onLoadPreset}>
                                        <SelectTrigger className="h-8 text-xs font-mono">
                                            <SelectValue placeholder="Load a Council Preset..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {presets.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id} className="text-xs font-mono">
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                        <span>{preset.name}</span>
                                                        <span className="text-muted-foreground text-[10px]">{preset.models?.length} members</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {presets.length === 0 && <div className="p-2 text-xs text-muted-foreground">No presets saved</div>}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <PresetSaveDialog
                                    isOpen={isSaveDialogOpen}
                                    onOpenChange={setIsSaveDialogOpen}
                                    presetName={presetName}
                                    setPresetName={setPresetName}
                                    onSave={onSavePreset}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-muted-foreground uppercase">Council Members (Debaters)</label>
                                <ModelSelector
                                    mode="multiple"
                                    value={councilMembers}
                                    onValueChange={(val) => setCouncilMembers(val as CouncilMember[])}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-mono text-muted-foreground uppercase">Judge (Synthesizer)</label>
                                    <JudgeConfigDialog
                                        judgePrompt={judgePrompt}
                                        setJudgePrompt={setJudgePrompt}
                                        isOpen={isJudgeConfigOpen}
                                        onOpenChange={setIsJudgeConfigOpen}
                                        defaultPrompt={defaultJudgePrompt}
                                    />
                                </div>
                                <ModelSelector
                                    mode="single"
                                    value={judgeModel}
                                    onValueChange={(val) => setJudgeModel(val as string)}
                                />
                            </div>
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
