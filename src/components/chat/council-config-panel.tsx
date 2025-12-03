'use client';

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Settings2, ChevronUp, ChevronDown } from 'lucide-react'
import { ModelSelector, CouncilMember } from '@/components/model-selector'
import { JudgeConfigDialog } from './judge-config-dialog'
import { PresetSaveDialog } from './preset-save-dialog'
import { cn } from "@/lib/utils"

export interface CouncilPreset {
    id: string;
    name: string;
    judge_model?: string | null;
    judge_prompt_id?: string | null;
    judge_settings?: string | null;
    judgePrompt?: { id: string; name: string; content?: string } | null;
    models?: Array<{ id: string; instanceId?: string; model_id: string; system_prompt_override?: string | null }>;
}

interface CouncilConfigSnapshot {
    judgeModel: string;
    judgePromptId: string | null;
    members: CouncilMember[];
}

interface CouncilConfigPanelProps {
    councilMembers: CouncilMember[]
    setCouncilMembers: (members: CouncilMember[]) => void
    judgeModel: string
    setJudgeModel: (model: string) => void
    judgePrompt: string
    setJudgePrompt: (prompt: string) => void
    judgePromptId: string | null
    defaultJudgePrompt: string
    presets: CouncilPreset[]
    sourceCouncilId: string | null
    onApplyPreset: (id: string) => void
    onClearPreset: () => void
    onSavePreset: () => void
    presetName: string
    setPresetName: (name: string) => void
    isConfigOpen: boolean
    setIsConfigOpen: (open: boolean) => void
    isJudgeConfigOpen: boolean
    setIsJudgeConfigOpen: (open: boolean) => void
    isSaveDialogOpen: boolean
    setIsSaveDialogOpen: (open: boolean) => void
}

const getModelShortName = (modelId?: string | null) => {
    if (!modelId) return 'Unassigned';
    const segments = modelId.split('/');
    return segments[segments.length - 1] || modelId;
};

const serializeMembers = (ids: string[]) =>
    ids.filter(Boolean).sort().join('|');

export function compareConfigToCouncil(
    config: CouncilConfigSnapshot,
    council: CouncilPreset
): boolean {
    const judgeMatches = (config.judgeModel || '') === (council.judge_model || '');
    if (!judgeMatches) return false;

    const configPrompt = config.judgePromptId || '';
    const councilPrompt = council.judge_prompt_id || council.judgePrompt?.id || '';
    if (configPrompt !== councilPrompt) return false;

    const configMembers = serializeMembers(config.members.map(member => member.modelId));
    const councilMembers = serializeMembers((council.models || []).map(member => member.model_id));
    return configMembers === councilMembers;
}

export function CouncilConfigPanel({
    councilMembers,
    setCouncilMembers,
    judgeModel,
    setJudgeModel,
    judgePrompt,
    setJudgePrompt,
    judgePromptId,
    defaultJudgePrompt,
    presets,
    sourceCouncilId,
    onApplyPreset,
    onClearPreset,
    onSavePreset,
    presetName,
    setPresetName,
    isConfigOpen,
    setIsConfigOpen,
    isJudgeConfigOpen,
    setIsJudgeConfigOpen,
    isSaveDialogOpen,
    setIsSaveDialogOpen
}: CouncilConfigPanelProps) {
    const isCouncilMode = councilMembers.length >= 2;

    const currentConfig = {
        judgeModel,
        judgePromptId,
        members: councilMembers,
    };

    const activePreset = React.useMemo(() => {
        if (!sourceCouncilId) return null;
        return presets.find((preset) => preset.id === sourceCouncilId) || null;
    }, [sourceCouncilId, presets]);

    const matchesPreset = Boolean(activePreset && compareConfigToCouncil(currentConfig, activePreset));
    const isCustomConfig = !activePreset;
    const configStatusLabel = isCustomConfig
        ? 'Custom'
        : matchesPreset
            ? activePreset!.name
            : `${activePreset!.name} (modified)`;
    const configStatusVariant: "default" | "secondary" | "outline" = isCustomConfig
        ? "secondary"
        : matchesPreset
            ? "default"
            : "outline";
    const canSavePreset = !activePreset || !matchesPreset;

    React.useEffect(() => {
        if (!canSavePreset && isSaveDialogOpen) {
            setIsSaveDialogOpen(false);
        }
    }, [canSavePreset, isSaveDialogOpen, setIsSaveDialogOpen]);

    const handlePresetSelect = (value: string) => {
        if (!value) {
            onClearPreset();
            return;
        }
        onApplyPreset(value);
    };

    const handleReapplyPreset = () => {
        if (activePreset) {
            onApplyPreset(activePreset.id);
        }
    };

    const promptLabel = React.useMemo(() => {
        if (judgePromptId) {
            const matchingPreset = presets.find(
                (preset) =>
                    preset.judge_prompt_id === judgePromptId ||
                    preset.judgePrompt?.id === judgePromptId
            );
            return matchingPreset?.judgePrompt?.name || 'Custom Prompt';
        }
        if (activePreset?.judgePrompt?.name) {
            return activePreset.judgePrompt.name;
        }
        return 'Default Prompt';
    }, [judgePromptId, presets, activePreset]);

    const memberSummary = councilMembers.length
        ? councilMembers.map(member => getModelShortName(member.modelId)).join(', ')
        : 'No members selected';

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <Collapsible
                open={isConfigOpen}
                onOpenChange={setIsConfigOpen}
                className="w-full"
            >
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-serif font-medium">Session Settings</h2>
                        <Badge 
                            variant={isCouncilMode ? "default" : "secondary"}
                            className="font-mono text-xs uppercase"
                        >
                            {isCouncilMode ? "Council" : "Solo"}
                        </Badge>
                    </div>

                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isConfigOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle Config</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-4 pb-4 space-y-4">
                    {isCouncilMode && (
                        <div className="space-y-3 pt-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <Label className="text-[11px] font-mono uppercase text-muted-foreground">Apply Council</Label>
                                    <Select
                                        value={sourceCouncilId || '__custom__'}
                                        onValueChange={(value) => handlePresetSelect(value === '__custom__' ? '' : value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs font-mono">
                                            <SelectValue placeholder="Load a Council Preset..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__custom__">Custom (no preset)</SelectItem>
                                            {presets.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id} className="text-xs font-mono">
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                        <span>{preset.name}</span>
                                                        <span className="text-muted-foreground text-[10px]">{preset.models?.length || 0} members</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {presets.length === 0 && (
                                                <div className="p-2 text-xs text-muted-foreground">No presets saved</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {activePreset && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs font-mono"
                                                onClick={handleReapplyPreset}
                                            >
                                                Reapply
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs font-mono"
                                                onClick={onClearPreset}
                                            >
                                                Detach
                                            </Button>
                                        </>
                                    )}
                                    {canSavePreset && (
                                        <PresetSaveDialog
                                            isOpen={isSaveDialogOpen}
                                            onOpenChange={setIsSaveDialogOpen}
                                            presetName={presetName}
                                            setPresetName={setPresetName}
                                            onSave={onSavePreset}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-3 text-xs font-mono space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="uppercase tracking-[0.2em] text-muted-foreground">Current Config</span>
                                    <Badge variant={configStatusVariant} className="font-mono text-[10px] uppercase">
                                        {configStatusLabel}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-muted-foreground">Judge</span>
                                    <div className="flex flex-wrap items-center gap-2 font-sans text-sm">
                                        <span className="font-semibold">{judgeModel ? getModelShortName(judgeModel) : 'None selected'}</span>
                                        <Badge variant="secondary" className="text-[10px] uppercase">
                                            Prompt: {promptLabel}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-muted-foreground">Members</span>
                                    <p className="font-sans text-sm text-muted-foreground">
                                        {memberSummary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground uppercase">
                                Models
                                {!isCouncilMode && (
                                    <span className="ml-2 text-[10px] normal-case text-muted-foreground/60">
                                        (add 2+ for council mode)
                                    </span>
                                )}
                            </label>
                            <ModelSelector
                                mode="multiple"
                                value={councilMembers}
                                onValueChange={(val) => setCouncilMembers(val as CouncilMember[])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className={cn(
                                    "text-xs font-mono uppercase",
                                    !isCouncilMode ? "text-muted-foreground/50" : "text-muted-foreground"
                                )}>
                                    Judge (Synthesizer)
                                </label>
                                <JudgeConfigDialog
                                    judgePrompt={judgePrompt}
                                    setJudgePrompt={setJudgePrompt}
                                    isOpen={isJudgeConfigOpen}
                                    onOpenChange={setIsJudgeConfigOpen}
                                    defaultPrompt={defaultJudgePrompt}
                                    trigger={
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className={cn(
                                                "h-4 w-4",
                                                !isCouncilMode ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            disabled={!isCouncilMode}
                                            title="Judge Settings"
                                        >
                                            <Settings2 className="h-3 w-3" />
                                        </Button>
                                    }
                                />
                            </div>
                            <div className={cn(!isCouncilMode && "opacity-50 pointer-events-none")}>
                                <ModelSelector
                                    mode="single"
                                    value={judgeModel}
                                    onValueChange={(val) => setJudgeModel(val as string)}
                                />
                            </div>
                            {!isCouncilMode && (
                                <p className="text-[10px] text-muted-foreground/60 font-mono">
                                    Judge is enabled when 2+ models are selected
                                </p>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
