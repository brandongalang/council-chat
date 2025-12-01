import { useState, useRef } from 'react';
import { UIMessage as Message } from '@ai-sdk/react';
import { CouncilResponse } from '@/types/council';
import { CouncilMember } from '@/components/model-selector';

export function useCouncil() {
    const [councilResponses, setCouncilResponses] = useState<CouncilResponse[]>([]);
    const [isCouncilActive, setIsCouncilActive] = useState(false);

    // Store context for retries
    const lastMessagesRef = useRef<Message[]>([]);
    const lastMembersRef = useRef<CouncilMember[]>([]);

    const generateSingleResponse = async (
        member: CouncilMember,
        messages: Message[],
        index: number,
        currentResponses: CouncilResponse[],
        updateState: (responses: CouncilResponse[]) => void
    ) => {
        let attempts = 0;
        const maxRetries = 3;
        let success = false;

        // Clone array to avoid mutation issues
        const responses = [...currentResponses];

        while (attempts < maxRetries && !success) {
            attempts++;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages,
                        model: member.modelId,
                        persona: member.persona,
                        save: false // Transient generation
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok || !response.body) throw new Error(`Failed with status ${response.status}`);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                // Update status to streaming
                responses[index] = { ...responses[index], status: 'streaming', content: '' };
                updateState([...responses]);

                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;

                    // Check for usage data
                    if (fullContent.includes('__USAGE__:')) {
                        const parts = fullContent.split('__USAGE__:');
                        const content = parts[0];
                        const usageJson = parts[1];

                        try {
                            const usage = JSON.parse(usageJson);
                            responses[index] = {
                                ...responses[index],
                                content: content,
                                promptTokens: usage.promptTokens,
                                completionTokens: usage.completionTokens
                            };
                        } catch (e) {
                            console.error('Failed to parse usage:', e);
                            // Fallback to just content if parsing fails
                            responses[index] = { ...responses[index], content: content };
                        }
                    } else {
                        responses[index] = { ...responses[index], content: fullContent };
                    }

                    updateState([...responses]);
                }

                // Final cleanup to ensure usage is processed if it came in the last chunk
                if (fullContent.includes('__USAGE__:')) {
                    const parts = fullContent.split('__USAGE__:');
                    const content = parts[0];
                    const usageJson = parts[1];
                    try {
                        const usage = JSON.parse(usageJson);
                        responses[index] = {
                            ...responses[index],
                            content: content,
                            promptTokens: usage.promptTokens,
                            completionTokens: usage.completionTokens,
                            status: 'completed'
                        };
                    } catch (e) {
                        responses[index] = { ...responses[index], content: content, status: 'completed' };
                    }
                } else {
                    responses[index] = { ...responses[index], status: 'completed' };
                }

                updateState([...responses]);
                success = true;

            } catch (err: any) {
                console.error(`Attempt ${attempts} failed for ${member.modelId}:`, err);
                if (attempts === maxRetries) {
                    responses[index] = {
                        ...responses[index],
                        status: 'error',
                        content: `Failed to generate response after ${maxRetries} attempts. Error: ${err.name === 'AbortError' ? 'Timeout' : err.message}`
                    };
                    updateState([...responses]);
                } else {
                    // Exponential backoff: 1s, 2s, 3s
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }
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
                generateSingleResponse(member, messages, index, newResponses, (updated) => {
                    setCouncilResponses(updated);
                    onUpdate(updated);
                })
            ));
        } finally {
            setIsCouncilActive(false);
        }

        return newResponses; // Note: This returns the initial array reference, not the final state. 
        // The caller relies on onUpdate or the state.
    };

    const retryMember = async (modelId: string, onUpdate?: (responses: CouncilResponse[]) => void) => {
        const index = councilResponses.findIndex(r => r.modelId === modelId);
        if (index === -1) return;

        const member = lastMembersRef.current.find(m => m.modelId === modelId);
        if (!member) return;

        // Reset status to loading
        const updatedResponses = [...councilResponses];
        updatedResponses[index] = { ...updatedResponses[index], status: 'loading', content: '' };
        setCouncilResponses(updatedResponses);
        if (onUpdate) onUpdate(updatedResponses);

        await generateSingleResponse(
            member,
            lastMessagesRef.current,
            index,
            updatedResponses,
            (updated) => {
                setCouncilResponses(updated);
                if (onUpdate) onUpdate(updated);
            }
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
