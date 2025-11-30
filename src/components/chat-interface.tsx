'use client';

import { useChat } from '@ai-sdk/react';
import { CouncilAccordion } from '@/components/council/council-accordion';

import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { useState } from 'react';
import { ModelSelector } from '@/components/model-selector';
import { Button } from '@/components/ui/button';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useCouncil } from '@/hooks/use-council';
import { CouncilResponse } from '@/types/council';
import type React from 'react';
import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, Trash2, Edit2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant' | 'data';
    content: string;
    annotations?: any;
}

import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ChatInterface() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [mode, setMode] = useState<'solo' | 'council'>('solo');
    const [soloModel, setSoloModel] = useState<string>('openai/gpt-4o');
    const [councilMembers, setCouncilMembers] = useState<string[]>(['openai/gpt-4-turbo', 'anthropic/claude-3-opus']);
    const [judgeModel, setJudgeModel] = useState<string>('openai/gpt-4o');
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [temporaryCouncilResponses, setTemporaryCouncilResponses] = useState<CouncilResponse[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(searchParams.get('id'));

    // Presets State
    const [presets, setPresets] = useState<any[]>([]);
    const [presetName, setPresetName] = useState('');
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    // Judge Config State
    const DEFAULT_JUDGE_PROMPT = `You are the Chief Justice of an AI Council. Your role is to synthesize the perspectives provided above into a single, authoritative response.

1. **Analyze:** Briefly evaluate the strengths and weaknesses of each Council Member's argument.
2. **Synthesize:** Merge the best insights from all members.
3. **Decide:** Provide a final answer to the User's Query.

Tone: Diplomatic but decisive. Acknowledge nuance, but do not equivocate.
Format: Use clear headings or bullet points for the analysis if helpful, but keep the final answer direct.`;

    const [judgePrompt, setJudgePrompt] = useState(DEFAULT_JUDGE_PROMPT);
    const [isJudgeConfigOpen, setIsJudgeConfigOpen] = useState(false);

    const { generateCouncilResponses, isCouncilActive } = useCouncil();

    // Fetch presets on mount
    useEffect(() => {
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        try {
            const res = await fetch('/api/councils');
            if (res.ok) {
                const data = await res.json();
                setPresets(data);
            }
        } catch (error) {
            console.error('Failed to fetch presets:', error);
        }
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) return;

        try {
            const res = await fetch('/api/councils', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: presetName,
                    description: '',
                    judgeModel: judgeModel,
                    members: councilMembers
                })
            });

            if (res.ok) {
                toast.success('Preset saved');
                setPresetName('');
                setIsSaveDialogOpen(false);
                fetchPresets();
            } else {
                toast.error('Failed to save preset');
            }
        } catch (error) {
            toast.error('Error saving preset');
        }
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setJudgeModel(preset.judge_model || 'openai/gpt-4o');
            // Extract model IDs from the relation
            const members = preset.models.map((m: any) => m.model_id);
            setCouncilMembers(members);
            toast.success(`Loaded preset: ${preset.name}`);
        }
    };

    const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/councils/${presetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Preset deleted');
                fetchPresets();
            }
        } catch (error) {
            toast.error('Error deleting preset');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, stop, append, setMessages } = useChat({
        api: '/api/chat',
        body: { chatId: currentChatId }, // Pass current chat ID to server
        onResponse: (response: Response) => {
            const id = response.headers.get('X-Chat-Id');
            if (id && id !== currentChatId) {
                setCurrentChatId(id);
                router.replace(`/chat?id=${id}`, { scroll: false });
            }
        },
        onFinish: (message: Message) => {
            // If we just started a new chat, the server might return the new Chat ID.
            // But useChat doesn't easily expose custom data from the stream unless we use onFinish with data.
            // We are using StreamData in the server, so we can listen for it?
            // Actually, let's just refresh the sidebar or rely on the server response if possible.
            // For now, we rely on the fact that if we have a currentChatId, we send it.
            // If we don't, the server creates one. We need to get it back to update the URL/State.
            // The server sends `data` with `chat_id`.
        },
        onError: (error: Error) => {
            toast.error("Failed to send message: " + error.message);
        }
    } as any) as any;

    // Handle loading a chat
    const loadChat = async (chatId: string) => {
        setCurrentChatId(chatId);
        setMessages([]); // Clear current
        try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const data = await res.json();
                // Convert DB messages to AI SDK messages
                const loadedMessages = data.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    annotations: m.annotations ? JSON.parse(m.annotations) : undefined
                }));
                setMessages(loadedMessages);
            }
        } catch (e) {
            console.error("Failed to load chat", e);
        }
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
        setTemporaryCouncilResponses([]);
    };

    // Custom submit handler for Council logic
    const handleCouncilSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isCouncilActive) return;

        const userMessage = input;

        // SOLO MODE: Bypass Council Logic
        if (mode === 'solo') {
            handleInputChange({ target: { value: '' } } as any);
            await append({
                role: 'user',
                content: userMessage,
            }, {
                body: { model: soloModel, chatId: currentChatId }
            });
            return;
        }

        // COUNCIL MODE: Run Orchestrator
        // Clear input immediately for UX
        handleInputChange({ target: { value: '' } } as any);

        setTemporaryCouncilResponses([]); // Reset

        // Generate Council Responses
        // We need the current history to pass to them
        const history = messages.map((m: Message) => ({ role: m.role, content: m.content }));
        const userMsgObject = { role: 'user', content: userMessage } as Message;

        // Start Council Deliberation
        const councilResults = await generateCouncilResponses(
            [...history, userMsgObject],
            councilMembers,
            (responses) => setTemporaryCouncilResponses(responses) // Real-time updates if we want to show them outside the chat list
        );

        // Prepare Context for Judge
        const contextString = councilResults.map(r => `[Agent: ${r.modelName}]\n${r.content}`).join('\n\n');

        // Trigger Judge (The actual Chat Item)
        await append({
            role: 'user',
            content: userMessage,
        }, {
            body: {
                model: judgeModel,
                councilContext: contextString,
                councilData: councilResults, // This will be returned as annotations
                chatId: currentChatId,
                judgePrompt: judgePrompt
            }
        });

        setTemporaryCouncilResponses([]); // Clear temp display once it's integrated into the message
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ChatSidebar
                currentChatId={currentChatId}
                onSelectChat={loadChat}
                onNewChat={handleNewChat}
            />

            <div className="flex flex-col flex-1 h-full relative">
                {/* Council Configuration Header */}
                <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                    <Collapsible
                        open={isConfigOpen}
                        onOpenChange={setIsConfigOpen}
                        className="w-full"
                    >
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-4">
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
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* Preset Controls */}
                                    <div className="md:col-span-2 flex items-center gap-2 mb-2 p-2 bg-muted/30 rounded-md border border-dashed">
                                        <div className="flex-1">
                                            <Select onValueChange={handleLoadPreset}>
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

                                        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
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
                                                    <Button onClick={handleSavePreset}>Save Preset</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-muted-foreground uppercase">Council Members (Debaters)</label>
                                        <ModelSelector
                                            mode="multiple"
                                            value={councilMembers}
                                            onValueChange={(val) => setCouncilMembers(val as string[])}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-mono text-muted-foreground uppercase">Judge (Synthesizer)</label>
                                            <Dialog open={isJudgeConfigOpen} onOpenChange={setIsJudgeConfigOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                                                        <Edit2 className="h-3 w-3 mr-1" />
                                                        Customize Persona
                                                    </Button>
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
                                                            <Label htmlFor="prompt">System Prompt</Label>
                                                            <Textarea
                                                                id="prompt"
                                                                value={judgePrompt}
                                                                onChange={(e) => setJudgePrompt(e.target.value)}
                                                                className="h-[300px] font-mono text-xs"
                                                                placeholder="Enter system prompt..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setJudgePrompt(DEFAULT_JUDGE_PROMPT)}>Reset to Default</Button>
                                                        <Button onClick={() => setIsJudgeConfigOpen(false)}>Done</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
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

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <ChatList messages={messages} isLoading={isLoading} />

                    {/* Council Accordion Overlay (While deliberating) */}
                    {isCouncilActive && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t animate-in slide-in-from-bottom-10 max-h-[50vh] overflow-y-auto shadow-2xl z-20">
                            <CouncilAccordion responses={temporaryCouncilResponses} />
                        </div>
                    )}
                </div>
                <ChatInput
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleCouncilSubmit}
                    isLoading={isLoading || isCouncilActive}
                    stop={stop}
                />
            </div>
        </div>
    );
}
