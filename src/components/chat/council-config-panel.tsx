import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { Settings2, Menu, Edit2, User, Users, Save } from 'lucide-react'
import { ModelSelector } from '@/components/model-selector'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChatSidebar } from '@/components/chat-sidebar'
import { JudgeConfigDialog } from './judge-config-dialog'
import { PresetSaveDialog } from './preset-save-dialog'
import { useRouter, useSearchParams } from 'next/navigation';
import { CouncilMemberRow } from './council-member-row';
import { PromptSelector } from './prompt-selector';
import { SYNTHESIZER_PROMPTS } from '@/constants/council-prompts';
import { cn } from '@/lib/utils';
import { ConversationStats } from './conversation-stats'
import { UIMessage } from '@ai-sdk/react'
import { CouncilMember } from '@/types/council';

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
    messages: UIMessage[]
    selectedPresetId: string | null
    setSelectedPresetId: (id: string | null) => void
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
    setIsSaveDialogOpen,
    messages,
    selectedPresetId,
    setSelectedPresetId
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
                        <div className="hidden md:block ml-4">
                            <ConversationStats messages={messages} />
                        </div>
                    </div>

                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            <Settings2 className="h-4 w-4" />
                            <span className="sr-only">Toggle Config</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-4 pb-4 space-y-4">
                    <Tabs value={mode} onValueChange={(v) => setMode(v as 'solo' | 'council')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="solo" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Solo Mode
                            </TabsTrigger>
                            <TabsTrigger value="council" className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Council Mode
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="solo" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-muted-foreground uppercase">Model</label>
                                <ModelSelector
                                    mode="single"
                                    value={soloModel}
                                    onValueChange={(val) => setSoloModel(val as string)}
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Judge Model (Optional)</Label>
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
                        </TabsContent>

                        <TabsContent value="council" className="space-y-4 mt-0">
                            {/* Preset Controls */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-muted-foreground uppercase">Load Preset</label>
                                <Select value={selectedPresetId || 'adhoc'} onValueChange={onLoadPreset}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select a preset..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adhoc">
                                            <span className="font-medium">Ad-hoc Session</span>
                                            <span className="ml-2 text-xs text-muted-foreground">(Custom)</span>
                                        </SelectItem>
                                        {presets.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id}>
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span>{preset.name}</span>
                                                    <span className="text-muted-foreground text-xs">{preset.models?.length} members</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Council Members Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-mono text-muted-foreground uppercase">Council Members</label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setCouncilMembers([
                                                    ...councilMembers,
                                                    { modelId: 'openai/gpt-4o', promptTemplateId: 'vanilla' }
                                                ]);
                                                if (selectedPresetId) setSelectedPresetId(null);
                                            }}
                                            className="h-6 text-xs"
                                        >
                                            + Add Member
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {councilMembers.map((member, idx) => (
                                            <CouncilMemberRow
                                                key={idx}
                                                member={member}
                                                index={idx}
                                                onUpdate={(index, updates) => {
                                                    const newMembers = [...councilMembers];
                                                    newMembers[index] = { ...newMembers[index], ...updates };
                                                    setCouncilMembers(newMembers);
                                                    if (selectedPresetId) setSelectedPresetId(null);
                                                }}
                                                onRemove={(index) => {
                                                    const newMembers = councilMembers.filter((_, i) => i !== index);
                                                    setCouncilMembers(newMembers);
                                                    if (selectedPresetId) setSelectedPresetId(null);
                                                }}
                                                showRemove={councilMembers.length > 1}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Judge Section */}
                                <div className="space-y-3 pt-2 border-t">
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

                                    <div className="space-y-2">
                                        <ModelSelector
                                            mode="single"
                                            value={judgeModel}
                                            onValueChange={(val) => {
                                                setJudgeModel(val as string);
                                                if (selectedPresetId) setSelectedPresetId(null);
                                            }}
                                        />

                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <PromptSelector
                                                    value={SYNTHESIZER_PROMPTS.find(p => p.systemPrompt === judgePrompt)?.id}
                                                    onValueChange={(val) => {
                                                        const template = SYNTHESIZER_PROMPTS.find(p => p.id === val);
                                                        if (template) {
                                                            setJudgePrompt(template.systemPrompt);
                                                        } else {
                                                            setJudgePrompt('');
                                                        }
                                                        if (selectedPresetId) setSelectedPresetId(null);
                                                    }}
                                                    prompts={SYNTHESIZER_PROMPTS}
                                                    placeholder="Select Strategy..."
                                                    className="h-9"
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => setIsJudgeConfigOpen(true)}
                                                title="Edit Custom Prompt"
                                            >
                                                <span className="sr-only">Edit Prompt</span>
                                                <span className="text-xs">✏️</span>
                                            </Button>
                                        </div>

                                        {/* Quick Strategy Buttons */}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['creative_maximize', 'risk_assessment', 'action_oriented'].map(id => {
                                                const template = SYNTHESIZER_PROMPTS.find(p => p.id === id);
                                                if (!template) return null;
                                                const isActive = judgePrompt === template.systemPrompt;

                                                return (
                                                    <Button
                                                        key={id}
                                                        variant={isActive ? "secondary" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 text-[10px] px-2 gap-1",
                                                            isActive && "bg-primary/10 hover:bg-primary/20 border-primary/20"
                                                        )}
                                                        onClick={() => {
                                                            setJudgePrompt(template.systemPrompt);
                                                            if (selectedPresetId) setSelectedPresetId(null);
                                                        }}
                                                    >
                                                        <span>{template.icon}</span>
                                                        <span>{template.name}</span>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/50 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-2"
                                    onClick={() => setIsSaveDialogOpen(true)}
                                >
                                    <Save className="w-3 h-3" />
                                    Save as Preset
                                </Button>
                                <PresetSaveDialog
                                    isOpen={isSaveDialogOpen}
                                    onOpenChange={setIsSaveDialogOpen}
                                    presetName={presetName}
                                    setPresetName={setPresetName}
                                    onSave={onSavePreset}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
