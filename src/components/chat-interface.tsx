'use client';

import { useChat } from '@ai-sdk/react';
import { CouncilAccordion } from '@/components/council/council-accordion';

import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { useState } from 'react';
import { ModelSelector, CouncilMember } from '@/components/model-selector';
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
import { CouncilConfigPanel } from '@/components/chat/council-config-panel';
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
import { Save, Trash2, Edit2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Interface representing a chat message.
 */
interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant' | 'data';
    content: string;
    annotations?: any;
}

/**
 * Main Chat Interface Component.
 * Manages the state of the chat, council configuration, and interaction flow.
 * Handles switching between 'solo' and 'council' modes.
 *
 * @returns The rendered Chat Interface.
 */
export default function ChatInterface() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [mode, setMode] = useState<'solo' | 'council'>('solo');
    const [soloModel, setSoloModel] = useState<string>('openai/gpt-4o');
    const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([
        { modelId: 'openai/gpt-4-turbo' },
        { modelId: 'anthropic/claude-3-opus' }
    ]);
    const [judgeModel, setJudgeModel] = useState<string>('openai/gpt-4o');
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [temporaryCouncilResponses, setTemporaryCouncilResponses] = useState<CouncilResponse[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(searchParams.get('id'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                    members: councilMembers, // Now sends [{modelId, persona?}]
                    judgePrompt: judgePrompt
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

            // Load Judge Prompt
            try {
                const settings = preset.judge_settings ? JSON.parse(preset.judge_settings) : {};
                setJudgePrompt(settings.systemPrompt || '');
            } catch (e) {
                console.error('Failed to parse judge settings', e);
                setJudgePrompt('');
            }

            // Extract model IDs and personas
            const members = preset.models.map((m: any) => ({
                modelId: m.model_id,
                persona: m.system_prompt_override
            }));
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
        const trimmedInput = (input ?? '').trim();
        if (!trimmedInput || isCouncilActive) return;

        const userMessage = trimmedInput;

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

        // COUNCIL MODE: Require minimum 2 members
        if (councilMembers.length < 2) {
            toast.error('Council mode requires at least 2 members. Please add more models.');
            return;
        }

        // Clear input immediately for UX
        handleInputChange({ target: { value: '' } } as any);

        setTemporaryCouncilResponses([]); // Reset

        // Generate Council Responses
        // We need the current history to pass to them
        const history = messages.map((m: Message) => ({ role: m.role, content: m.content }));
        const userMsgObject = { role: 'user', content: userMessage } as Message;

        const updatedMessages = [...history, userMsgObject];

        // Start Council Deliberation
        const councilResponses = await generateCouncilResponses(
            updatedMessages,
            councilMembers, // Now passing CouncilMember[]
            (responses) => setTemporaryCouncilResponses(responses) // Real-time updates if we want to show them outside the chat list
        );

        // Prepare Context for Judge - include model name labels
        const contextString = councilResponses.map(r => `[Model: ${r.modelId}]\n${r.content}`).join('\n\n');

        // Trigger Judge (The actual Chat Item)
        await append({
            role: 'user',
            content: userMessage,
        }, {
            body: {
                model: judgeModel,
                chatId: currentChatId,
                councilContext: contextString,
                councilData: councilResponses,
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
                className="hidden md:flex"
            />

            <div className="flex flex-col flex-1 h-full relative">
                <CouncilConfigPanel
                    mode={mode}
                    setMode={setMode}
                    soloModel={soloModel}
                    setSoloModel={setSoloModel}
                    councilMembers={councilMembers}
                    setCouncilMembers={setCouncilMembers}
                    judgeModel={judgeModel}
                    setJudgeModel={setJudgeModel}
                    judgePrompt={judgePrompt}
                    setJudgePrompt={setJudgePrompt}
                    defaultJudgePrompt={DEFAULT_JUDGE_PROMPT}
                    presets={presets}
                    onLoadPreset={handleLoadPreset}
                    onSavePreset={handleSavePreset}
                    presetName={presetName}
                    setPresetName={setPresetName}
                    isConfigOpen={isConfigOpen}
                    setIsConfigOpen={setIsConfigOpen}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    currentChatId={currentChatId}
                    onSelectChat={loadChat}
                    onNewChat={handleNewChat}
                    isJudgeConfigOpen={isJudgeConfigOpen}
                    setIsJudgeConfigOpen={setIsJudgeConfigOpen}
                    isSaveDialogOpen={isSaveDialogOpen}
                    setIsSaveDialogOpen={setIsSaveDialogOpen}
                />

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
