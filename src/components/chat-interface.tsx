'use client';

import { useChat } from '@ai-sdk/react';
import type { UseChatHelpers } from '@ai-sdk/react';

import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { useState, useCallback, useRef } from 'react';
import type { CouncilMember, Model } from '@/components/model-selector';
import { useCouncil } from '@/hooks/use-council';
import { CouncilResponse } from '@/types/council';
import { CouncilConfigPanel, type CouncilPreset } from '@/components/chat/council-config-panel';
import type React from 'react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConversationUsagePanel } from '@/components/chat/conversation-usage-panel';
import { getLastConfig, saveLastConfig, StoredCouncilConfig } from '@/lib/config-storage';
import { estimateTokens } from '@/lib/token-utils';
import { getMessageContent } from '@/lib/message-utils';
import { DEFAULT_JUDGE_PROMPT } from '@/config/prompts';
import type { ChatMessage, MessageAnnotation } from '@/types/chat';

type StoredMessage = {
    id: string;
    role: ChatMessage['role'];
    content: string;
    annotations?: string | MessageAnnotation[] | null;
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    cost?: string | null;
};

const parseStoredAnnotations = (
    value?: string | MessageAnnotation[] | null
): MessageAnnotation[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value) as MessageAnnotation[];
    } catch (error) {
        console.warn('Failed to parse stored annotations', error);
        return undefined;
    }
};

const transformStoredMessages = (data: StoredMessage[]): ChatMessage[] =>
    data.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        parts: [{ type: 'text' as const, text: m.content }],
        annotations: parseStoredAnnotations(m.annotations),
        prompt_tokens: m.prompt_tokens ?? undefined,
        completion_tokens: m.completion_tokens ?? undefined,
        cost: m.cost ?? undefined,
    }));

/**
 * Build clean message history with all content as strings
 */
function buildCleanHistory(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
            role: m.role,
            content: getMessageContent(m)
        }))
        .filter(m => m.content.trim() !== '');
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
    // Unified model selection - mode is derived from count
    // Initialize empty, will load from localStorage
    const [selectedModels, setSelectedModels] = useState<CouncilMember[]>([]);
    const [judgeModel, setJudgeModel] = useState<string>('');
    const [judgePromptId, setJudgePromptId] = useState<string | null>(null);
    const [sourceCouncilId, setSourceCouncilId] = useState<string | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(searchParams.get('id'));
    const [configLoaded, setConfigLoaded] = useState(false);

    // Model metadata for context window checks
    const [modelData, setModelData] = useState<Model[]>([]);

    // Derive mode from number of selected models
    const isCouncilMode = selectedModels.length >= 2;

    // Own input state since AI SDK v2 doesn't provide it
    const [input, setInput] = useState('');

    // Presets State
    const [presets, setPresets] = useState<CouncilPreset[]>([]);
    const [presetName, setPresetName] = useState('');
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const [judgePrompt, setJudgePrompt] = useState(DEFAULT_JUDGE_PROMPT);
    const [isJudgeConfigOpen, setIsJudgeConfigOpen] = useState(false);
    const handleJudgePromptChange = useCallback((prompt: string) => {
        setJudgePrompt(prompt);
        setJudgePromptId(null);
    }, []);

    const { generateCouncilResponses, cancelCouncilResponses, isCouncilActive } = useCouncil();

    // Ref to store council data that needs to be attached to the message after streaming
    const pendingCouncilDataRef = useRef<{ councilResponses: CouncilResponse[]; judgeModel: string } | null>(null);
    // State to pass council data to ChatList during streaming
    const [streamingCouncilData, setStreamingCouncilData] = useState<{ councilResponses: CouncilResponse[]; judgeModel: string } | null>(null);

    // AI SDK v2 useChat - MUST be declared before any code that uses setMessages
    // Note: Using type assertion due to API changes in @ai-sdk/react v2
    const {
        messages,
        setMessages,
        sendMessage,
        stop,
        status
    } = useChat({
        // @ts-expect-error - Legacy API properties, works at runtime
        api: '/api/chat',
        body: { chatId: currentChatId },
        onResponse: (response: Response) => {
            const id = response.headers.get('X-Chat-Id');
            if (id && id !== currentChatId) {
                setCurrentChatId(id);
                router.replace(`/chat?id=${id}`, { scroll: false });
            }
        },
        onFinish: ({ message }: { message: ChatMessage }) => {
            // Attach pending council data as annotations to the completed message
            if (pendingCouncilDataRef.current) {
                const { councilResponses, judgeModel: usedJudgeModel } = pendingCouncilDataRef.current;
                pendingCouncilDataRef.current = null;
                setStreamingCouncilData(null); // Clear streaming state so message uses its own annotations

                // Update the message with annotations (council data + judge model info) AND estimated usage
                setMessages(prevMessages => {
                    const typedPrev = prevMessages as ChatMessage[];
                    return typedPrev.map(m => {
                        if (m.id !== message.id) {
                            return m;
                        }

                        const content = getMessageContent(m);
                        return {
                            ...m,
                            annotations: [councilResponses, { judgeModel: usedJudgeModel }],
                            completion_tokens: estimateTokens(content),
                        };
                    });
                });
            } else {
                // For non-council messages, still update usage
                setStreamingCouncilData(null); // Clear any stale streaming state
                setMessages(prevMessages => {
                    const typedPrev = prevMessages as ChatMessage[];
                    return typedPrev.map(m => {
                        if (m.id !== message.id) {
                            return m;
                        }
                        return {
                            ...m,
                            completion_tokens: estimateTokens(getMessageContent(m)),
                        };
                    });
                });
            }
        },
        onError: (error: Error) => {
            // Filter out AI SDK tool call validation errors from OpenRouter responses
            if (error.message?.includes('invalid_value') &&
                (error.message?.includes('web_search_call') ||
                    error.message?.includes('file_search_call') ||
                    error.message?.includes('image_generation_call'))) {
                console.warn('Suppressed AI SDK tool call validation error:', error);
                return; // Don't show toast for these known issues
            }
            toast.error("Failed to send message: " + error.message);
            pendingCouncilDataRef.current = null;
            setStreamingCouncilData(null);
        }
    });

    // Derive isLoading from status
    const isLoading = status === 'streaming' || status === 'submitted';

    /**
     * Stream synthesizer response from direct fetch and update message progressively
     */
    const streamSynthesizerResponse = async (
        response: Response,
        messageId: string,
        councilResponses: CouncilResponse[],
        usedJudgeModel: string
    ) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (!reader) throw new Error('No response body');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;

            // Update message content progressively
            setMessages(prev => {
                const typedPrev = prev as ChatMessage[];
                return typedPrev.map(m =>
                    m.id === messageId
                        ? { ...m, content: fullContent }
                        : m
                );
            });
        }

        // On complete: attach annotations and estimated tokens
        const estimatedCompletion = estimateTokens(fullContent);
        setMessages(prev => {
            const typedPrev = prev as ChatMessage[];
            return typedPrev.map(m =>
                m.id === messageId
                    ? {
                        ...m,
                        content: fullContent,
                        annotations: [councilResponses, { judgeModel: usedJudgeModel }],
                        completion_tokens: estimatedCompletion,
                    }
                    : m
            );
        });

        setStreamingCouncilData(null);
        return fullContent;
    };

    // Fetch presets and model data on mount
    useEffect(() => {
        fetchPresets();
        fetchModelData();
    }, []);

    // Load config from localStorage on mount
    useEffect(() => {
        const saved = getLastConfig();
        if (saved) {
            if (saved.members?.length) {
                setSelectedModels(saved.members.map((member, index) => ({
                    instanceId: `stored-${index}-${member.modelId}-${Math.random().toString(36).slice(2, 7)}`,
                    modelId: member.modelId,
                    persona: member.persona,
                })));
            }
            if (saved.judgeModel) {
                setJudgeModel(saved.judgeModel);
            }
            if (saved.judgePromptId !== undefined) {
                setJudgePromptId(saved.judgePromptId);
            }
            if (saved.judgePrompt) {
                setJudgePrompt(saved.judgePrompt);
            }
            setSourceCouncilId(saved.sourceCouncilId ?? null);
        }
        setConfigLoaded(true);
    }, []);

    // Save config to localStorage whenever it changes (after initial load)
    useEffect(() => {
        if (!configLoaded) return;
        const config: StoredCouncilConfig = {
            judgeModel,
            judgePromptId,
            judgePrompt,
            members: selectedModels.map(({ modelId, persona }) => ({ modelId, persona })),
            sourceCouncilId,
        };
        saveLastConfig(config);
    }, [selectedModels, judgeModel, judgePrompt, judgePromptId, sourceCouncilId, configLoaded]);

    const fetchPresets = async () => {
        try {
            const res = await fetch('/api/councils');
            if (res.ok) {
                const data = await res.json() as CouncilPreset[];
                setPresets(data);
            }
        } catch (error) {
            console.error('Failed to fetch presets:', error);
        }
    };

    const fetchModelData = async () => {
        try {
            const res = await fetch('/api/models');
            if (res.ok) {
                const data = await res.json() as Model[];
                if (Array.isArray(data)) {
                    setModelData(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch model data:', error);
        }
    };

    useEffect(() => {
        return () => {
            cancelCouncilResponses();
        };
    }, [cancelCouncilResponses]);

    /**
     * Check if the conversation would exceed any model's context window
     * Returns null if OK, or an error message if limit exceeded
     */
    const checkContextLimits = (newMessage: string): string | null => {
        // Calculate total tokens in conversation
        const conversationText = (messages as ChatMessage[])
            .map(m => getMessageContent(m))
            .join('\n');
        const totalText = conversationText + '\n' + newMessage;
        const estimatedTokens = estimateTokens(totalText);

        // Add buffer for system prompts and response (~2000 tokens)
        const totalWithBuffer = estimatedTokens + 2000;

        // Get models to check based on mode
        const modelsToCheck = isCouncilMode
            ? [...selectedModels.map(m => m.modelId), judgeModel]
            : [selectedModels[0]?.modelId];

        // Check each model's context limit
        for (const modelId of modelsToCheck) {
            const model = modelData.find(m => m.id === modelId);
            if (model?.context_length && totalWithBuffer > model.context_length) {
                const modelName = model.name || modelId.split('/').pop() || modelId;
                const limit = model.context_length.toLocaleString();
                const estimated = totalWithBuffer.toLocaleString();
                return `Context limit exceeded for ${modelName}: ~${estimated} tokens estimated, limit is ${limit}`;
            }
        }

        return null;
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) return;

        try {
            const res = await fetch('/api/councils', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: presetName,
                    judgeModel,
                    judgePromptId,
                    members: selectedModels,
                    judgePrompt
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
            console.error('Error saving preset', error);
            toast.error('Error saving preset');
        }
    };

    const handleApplyPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setJudgeModel(preset.judge_model || 'openai/gpt-4o');

            try {
                const settings = preset.judge_settings ? JSON.parse(preset.judge_settings) : {};
                const promptContent = preset.judgePrompt?.content || settings.systemPrompt || DEFAULT_JUDGE_PROMPT;
                setJudgePrompt(promptContent);
            } catch (e) {
                console.error('Failed to parse judge settings', e);
                setJudgePrompt(DEFAULT_JUDGE_PROMPT);
            }

            const members = (preset.models ?? []).map((m, index: number) => ({
                instanceId: m.instanceId || m.id || `preset-${preset.id}-${index}-${Math.random().toString(36).slice(2, 7)}`,
                modelId: m.model_id,
                persona: m.system_prompt_override || undefined
            }));
            setSelectedModels(members);
            setJudgePromptId(preset.judge_prompt_id || preset.judgePrompt?.id || null);
            setSourceCouncilId(preset.id);
            toast.success(`Loaded preset: ${preset.name}`);
        }
    };

    const handleClearPreset = () => {
        setSourceCouncilId(null);
    };

    // Sync with URL changes (for sidebar navigation)
    useEffect(() => {
        const urlChatId = searchParams.get('id');
        if (urlChatId && urlChatId !== currentChatId) {
            // URL has a chat ID that's different from current - load it
            setCurrentChatId(urlChatId);
            setMessages([]);
            fetch(`/api/chats/${urlChatId}`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to load'))
                .then((data: StoredMessage[]) => {
                    const loadedMessages = transformStoredMessages(data);
                    setMessages(loadedMessages);
                })
                .catch(e => console.error("Failed to load chat", e));
        } else if (!urlChatId && currentChatId) {
            // URL changed to /chat (no id) - clear the chat
            setCurrentChatId(null);
            setMessages([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, currentChatId]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    }, []);

    // Custom submit handler for Council logic
    const stopAll = useCallback(() => {
        cancelCouncilResponses();
        stop();
    }, [cancelCouncilResponses, stop]);

    const handleCouncilSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isCouncilActive || isLoading) return;

        // Check context window limits before proceeding
        const contextError = checkContextLimits(trimmedInput);
        if (contextError) {
            toast.error(contextError);
            return;
        }

        const userMessage = trimmedInput;

        // Cancel any in-flight council responses before starting a new run
        cancelCouncilResponses();

        // SOLO MODE: Bypass Council Logic
        if (!isCouncilMode) {
            setInput('');
            await sendMessage(
                { text: userMessage },
                { body: { model: selectedModels[0].modelId, chatId: currentChatId } }
            );
            return;
        }

        // COUNCIL MODE: Require minimum 2 members
        if (selectedModels.length < 2) {
            toast.error('Council mode requires at least 2 members. Please add more models.');
            return;
        }

        // Clear input immediately for UX
        setInput('');

        // Create pending message ID for tracking
        const pendingMessageId = `pending-council-${Date.now()}`;
        const userMessageId = `user-${Date.now()}`;

        // Add user message and pending assistant message to the list
        const userMsg: ChatMessage = {
            id: userMessageId,
            role: 'user' as const,
            content: userMessage,
            parts: [{ type: 'text' as const, text: userMessage }],
        };

        // Initialize pending council responses
        const initialCouncilResponses: CouncilResponse[] = selectedModels.map(m => ({
            instanceId: m.instanceId || `${m.modelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            modelId: m.modelId,
            modelName: m.modelId.split('/').pop() || m.modelId,
            status: 'loading' as const,
            content: ''
        }));

        const pendingAssistantMsg: ChatMessage = {
            id: pendingMessageId,
            role: 'assistant' as const,
            content: '',
            parts: [{ type: 'text' as const, text: '' }],
            annotations: [initialCouncilResponses, { judgeModel, isPending: true }]
        };

        // Add both messages to the chat
        setMessages(prev => {
            const typedPrev = prev as ChatMessage[];
            return [...typedPrev, userMsg, pendingAssistantMsg];
        });

        // Generate Council Responses with inline updates
        const history = (messages as ChatMessage[]).map((m) => ({
            role: m.role,
            content: getMessageContent(m)
        }));
        const userMsgObject = { role: 'user', content: userMessage };
        const updatedMessages = [...history, userMsgObject];

        const councilResponses = await generateCouncilResponses(
            updatedMessages,
            selectedModels,
            (responses) => {
                // Update the pending message's annotations with live council responses
                setMessages(prev => {
                    const typedPrev = prev as ChatMessage[];
                    return typedPrev.map(m => {
                        if (m.id === pendingMessageId) {
                            return {
                                ...m,
                                annotations: [responses, { judgeModel, isPending: true }]
                            };
                        }
                        return m;
                    });
                });
            }
        );

        // === SYNTHESIZER: Direct fetch to avoid AI SDK format issues ===

        // 1. Build clean history (exclude the pending messages)
        const cleanHistory = buildCleanHistory(
            (messages as ChatMessage[]).filter(m => m.id !== pendingMessageId && m.id !== userMessageId)
        );

        // 2. Format council context with labels
        const councilContext = councilResponses.map((r, i) =>
            `[Council Member #${i + 1}: ${r.modelName}]\n${r.content}`
        ).join('\n\n');

        // 3. Create synthesizer message ID
        const synthesizerMsgId = `assistant-synth-${Date.now()}`;

        // 4. Update state: keep user message, replace pending assistant with synthesizer placeholder
        setMessages(prev => {
            const typedPrev = prev as ChatMessage[];
            const remaining = typedPrev.filter(m => m.id !== pendingMessageId);
            const synthesizerMessage: ChatMessage = {
                id: synthesizerMsgId,
                role: 'assistant',
                content: '',
                parts: [{ type: 'text' as const, text: '' }],
                annotations: [councilResponses, { judgeModel, isPending: false, isSynthesizing: true }]
            };
            return [...remaining, synthesizerMessage];
        });

        // Set streaming council data for UI
        setStreamingCouncilData({ councilResponses, judgeModel });

        try {
            // 5. Make direct fetch to API with properly formatted messages
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...cleanHistory,
                        { role: 'user', content: userMessage }
                    ],
                    model: judgeModel,
                    chatId: currentChatId,
                    councilContext: councilContext,
                    councilData: councilResponses,
                    judgePrompt: judgePrompt,
                    isJudge: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Synthesizer request failed: ${response.status}`);
            }

            // 6. Stream the response
            await streamSynthesizerResponse(response, synthesizerMsgId, councilResponses, judgeModel);
        } catch (error) {
            const messageText = error instanceof Error ? error.message : 'Unknown error';
            toast.error("Synthesis failed: " + messageText);
            setStreamingCouncilData(null);
        }
    };

    // Calculate total usage stats
    const usageStats = (messages as ChatMessage[]).reduce((acc, msg) => {
        const promptTokens = Number(msg.prompt_tokens ?? msg.promptTokens ?? 0) || 0;
        const completionTokens = Number(msg.completion_tokens ?? msg.completionTokens ?? 0) || 0;
        const cost = Number(msg.cost ?? 0) || 0;

        return {
            promptTokens: acc.promptTokens + promptTokens,
            completionTokens: acc.completionTokens + completionTokens,
            totalTokens: acc.totalTokens + promptTokens + completionTokens,
            cost: acc.cost + cost,
            messageCount: acc.messageCount + (msg.role === 'assistant' ? 1 : 0),
        };
    }, { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, messageCount: 0 });

    const hasUsageStats = usageStats.totalTokens > 0 || usageStats.cost > 0;

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <div className="flex flex-col flex-1 h-full relative">
                <CouncilConfigPanel
                    councilMembers={selectedModels}
                    setCouncilMembers={setSelectedModels}
                    judgeModel={judgeModel}
                    setJudgeModel={setJudgeModel}
                    judgePrompt={judgePrompt}
                    setJudgePrompt={handleJudgePromptChange}
                    judgePromptId={judgePromptId}
                    defaultJudgePrompt={DEFAULT_JUDGE_PROMPT}
                    presets={presets}
                    sourceCouncilId={sourceCouncilId}
                    onApplyPreset={handleApplyPreset}
                    onClearPreset={handleClearPreset}
                    onSavePreset={handleSavePreset}
                    presetName={presetName}
                    setPresetName={setPresetName}
                    isConfigOpen={isConfigOpen}
                    setIsConfigOpen={setIsConfigOpen}
                    isJudgeConfigOpen={isJudgeConfigOpen}
                    setIsJudgeConfigOpen={setIsJudgeConfigOpen}
                    isSaveDialogOpen={isSaveDialogOpen}
                    setIsSaveDialogOpen={setIsSaveDialogOpen}
                />

                {hasUsageStats && (
                    <div className="px-6 pt-4">
                        <ConversationUsagePanel summary={usageStats} messages={messages as ChatMessage[]} />
                    </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <ChatList
                        messages={messages as ChatMessage[]}
                        isLoading={isLoading}
                        streamingCouncilData={streamingCouncilData}
                    />
                </div>
                <ChatInput
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleCouncilSubmit}
                    isLoading={isLoading || isCouncilActive}
                    stop={stopAll}
                />
            </div>
        </div>
    );
}
