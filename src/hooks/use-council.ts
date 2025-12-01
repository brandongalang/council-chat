import { useState, useRef, useCallback } from 'react';
import { UIMessage as Message } from '@ai-sdk/react';
import { CouncilResponse } from '@/types/council';
import { CouncilMember } from '@/types/council';
import { fetchWithRetry, parseStreamResponse } from '@/lib/fetch-utils';

export function useCouncil() {
    const [councilResponses, setCouncilResponses] = useState<CouncilResponse[]>([]);
    const [isCouncilActive, setIsCouncilActive] = useState(false);

    // Store context for retries
    const lastMessagesRef = useRef<Message[]>([]);
    const lastMembersRef = useRef<CouncilMember[]>([]);

    const updateResponse = useCallback((index: number, updates: Partial<CouncilResponse>) => {
        setCouncilResponses(prev => {
            const newResponses = [...prev];
            if (newResponses[index]) {
                newResponses[index] = { ...newResponses[index], ...updates };
            }
            return newResponses;
        });
    }, []);

    const generateSingleResponse = async (
        member: CouncilMember,
        messages: Message[],
        index: number
    ) => {
        try {
            await fetchWithRetry(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages,
                            model: member.modelId,
                            persona: member.persona,
                            promptTemplateId: member.promptTemplateId,
                            customPrompt: member.customPrompt,
                            save: false // Transient generation
                        }),
                        signal: controller.signal
                    });

                    if (!response.ok || !response.body) throw new Error(`Failed with status ${response.status}`);

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    updateResponse(index, { status: 'streaming', content: '' });

                    let fullContent = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        fullContent += chunk;

                        const { content, usage } = parseStreamResponse(fullContent);

                        updateResponse(index, {
                            content,
                            ...(usage && {
                                promptTokens: usage.promptTokens,
                                completionTokens: usage.completionTokens
                            })
                        });
                    }

                    updateResponse(index, { status: 'completed' });

                } finally {
                    clearTimeout(timeoutId);
                }
            }, { maxRetries: 3 });

        } catch (err: unknown) {
            console.error(`Failed to generate response for ${member.modelId}:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            updateResponse(index, {
                status: 'error',
                errorMessage: err instanceof Error && err.name === 'AbortError' ? 'Timeout' : errorMessage
            });
        }
    };

    const generateCouncilResponses = async (
        messages: Message[],
        members: CouncilMember[],
        onUpdate: (responses: CouncilResponse[]) => void
    ) => {
        setIsCouncilActive(true);
        lastMessagesRef.current = messages;
        lastMembersRef.current = members;

        const newResponses: CouncilResponse[] = members.map(m => ({
            modelId: m.modelId,
            modelName: m.modelId.split('/').pop() || m.modelId,
            status: 'loading',
            content: '',
            promptTokens: 0,
            completionTokens: 0
        }));

        setCouncilResponses(newResponses);
        onUpdate(newResponses);

        try {
            await Promise.all(members.map((member, index) =>
                generateSingleResponse(member, messages, index)
            ));
        } finally {
            setIsCouncilActive(false);
        }

        return newResponses;
    };

    const retryMember = async (modelId: string) => {
        const index = councilResponses.findIndex(r => r.modelId === modelId);
        if (index === -1) return;

        const member = lastMembersRef.current.find(m => m.modelId === modelId);
        if (!member) return;

        updateResponse(index, { status: 'loading', content: '', errorMessage: undefined });

        await generateSingleResponse(
            member,
            lastMessagesRef.current,
            index
        );
    };

    return {
        councilResponses,
        isCouncilActive,
        generateCouncilResponses,
        setCouncilResponses,
        retryMember
    };
}
