'use client';

import { useChat } from '@ai-sdk/react';
import { CouncilAccordion } from '@/components/council/council-accordion';
import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { useState, useCallback } from 'react';
import { CouncilMember, Preset } from '@/types/council';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useCouncil } from '@/hooks/use-council';
import { useChatSession } from '@/hooks/use-chat-session';
import { CouncilResponse } from '@/types/council';
import { CouncilConfigPanel } from '@/components/chat/council-config-panel';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_COUNCIL_MEMBERS, DEFAULT_JUDGE_MODEL, DEFAULT_JUDGE_PROMPT } from '@/constants/council';

interface Message {
    id: string;
    role: 'system' | 'user' | 'assistant' | 'data';
    content: string;
    annotations?: any;
}

export default function ChatInterface() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [mode, setMode] = useState<'solo' | 'council'>('solo');
    const [soloModel, setSoloModel] = useState<string>('openai/gpt-4o');
    const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
    const [judgeModel, setJudgeModel] = useState<string>(DEFAULT_JUDGE_MODEL);
    const [judgePrompt, setJudgePrompt] = useState(DEFAULT_JUDGE_PROMPT);

    // UI State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isJudgeConfigOpen, setIsJudgeConfigOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [temporaryCouncilResponses, setTemporaryCouncilResponses] = useState<CouncilResponse[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(searchParams.get('id'));

    // Hooks
    const { generateCouncilResponses, isCouncilActive, retryMember } = useCouncil();
    const {
        presets,
        selectedPresetId,
        setSelectedPresetId,
        savePreset,
        deletePreset
    } = useChatSession();

    // AI SDK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { messages, setMessages, sendMessage, stop, status } = useChat({
        api: '/api/chat',
        body: { chatId: currentChatId },
        onResponse: (response: Response) => {
            const id = response.headers.get('X-Chat-Id');
            if (id && id !== currentChatId) {
                setCurrentChatId(id);
                router.replace(`/chat?id=${id}`, { scroll: false });
            }
        },
        onError: (error: Error) => {
            toast.error("Failed to send message: " + error.message);
        }
    } as any) as any;

    // Derive loading state from status
    const isLoading = status === 'streaming' || status === 'submitted';

    // Use local state for input
    const [localInput, setLocalInput] = useState('');
    const input = localInput;
    
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalInput(e.target.value);
    }, []);

    // Handlers
    const handleLoadPreset = (presetId: string) => {
        if (presetId === 'adhoc') {
            setSelectedPresetId(null);
            return;
        }

        const preset = presets.find((p: Preset) => p.id === presetId);
        if (preset) {
            setSelectedPresetId(presetId);
            setJudgeModel(preset.judge_model || 'openai/gpt-4o');

            try {
                const settings = preset.judge_settings ? JSON.parse(preset.judge_settings) : {};
                setJudgePrompt(settings.systemPrompt || '');
            } catch (e) {
                console.error('Failed to parse judge settings', e);
                setJudgePrompt('');
            }

            const members = preset.models.map((m: { model_id: string; system_prompt_override?: string; prompt_template_id?: string }) => ({
                modelId: m.model_id,
                persona: m.system_prompt_override, // Legacy
                promptTemplateId: m.prompt_template_id,
                customPrompt: m.system_prompt_override
            }));
            setCouncilMembers(members);
            toast.success(`Loaded preset: ${preset.name}`);
        }
    };

    const handleSavePresetWrapper = async () => {
        if (!presetName.trim()) return;
        const success = await savePreset(presetName, judgeModel, judgePrompt, councilMembers);
        if (success) {
            setPresetName('');
            setIsSaveDialogOpen(false);
        }
    };

    const loadChat = async (chatId: string) => {
        setCurrentChatId(chatId);
        setMessages([]);
        try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const data = await res.json();
                const loadedMessages = data.map((m: { id: string; role: 'system' | 'user' | 'assistant' | 'data'; content: string; annotations?: string }) => {
                    let parsedAnnotations;
                    if (m.annotations) {
                        try {
                            parsedAnnotations = JSON.parse(m.annotations);
                        } catch {
                            console.warn('Failed to parse annotations for message', m.id);
                        }
                    }
                    return {
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        annotations: parsedAnnotations
                    };
                });
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
        router.replace('/chat');
    };

    const handleCouncilSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input?.trim() || isCouncilActive) return;

        const userMessage = input;

        // SOLO MODE: Bypass Council Logic
        if (mode === 'solo') {
            setLocalInput('');
            await sendMessage(
                { text: userMessage },
                { body: { model: soloModel, chatId: currentChatId } }
            );
            return;
        }

        // Council Mode
        setLocalInput('');
        setTemporaryCouncilResponses([]);

        const history = messages.map((m: Message) => ({ role: m.role, content: m.content }));
        const userMsgObject = { role: 'user', content: userMessage } as Message;
        const updatedMessages = [...history, userMsgObject];

        const councilResponses = await generateCouncilResponses(
            updatedMessages,
            councilMembers,
            (responses) => setTemporaryCouncilResponses(responses)
        );

        await sendMessage(
            { text: userMessage },
            { 
                body: { 
                    chatId: currentChatId,
                    councilData: councilResponses,
                    judgePrompt: judgePrompt
                } 
            }
        );

        setTemporaryCouncilResponses([]);
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
                    onSavePreset={handleSavePresetWrapper}
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
                    messages={messages}
                    selectedPresetId={selectedPresetId}
                    setSelectedPresetId={setSelectedPresetId}
                />

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <ChatList messages={messages} />

                    {/* Council Accordion Overlay */}
                    {isCouncilActive && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t shadow-lg animate-in slide-in-from-bottom-10 max-h-[50vh] overflow-y-auto z-20">
                            <CouncilAccordion responses={temporaryCouncilResponses} onRetry={retryMember} />
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
