import { useCallback, useRef, useState } from 'react';
import { UIMessage as Message } from '@ai-sdk/react';
import { CouncilResponse } from '@/types/council';
import { CouncilMember } from '@/components/model-selector';
import { estimateTokens } from '@/lib/token-utils';
import { getMessageContent } from '@/lib/message-utils';

/**
 * Custom hook for managing the state and logic of Council-based chat generation.
 * Handles parallel fetching of responses from multiple models.
 */
export function useCouncil() {
    const [, setCouncilResponses] = useState<CouncilResponse[]>([]);
    const [isCouncilActive, setIsCouncilActive] = useState(false);
    const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

    const clearAbortController = (key: string) => {
        abortControllersRef.current.delete(key);
    };

    const cancelCouncilResponses = useCallback(() => {
        abortControllersRef.current.forEach((controller) => controller.abort());
        abortControllersRef.current.clear();

        setCouncilResponses((prev) =>
            prev.map((response) => {
                if (response.status === 'completed') return response;
                return {
                    ...response,
                    status: 'error',
                    content: response.content || 'Cancelled by user.',
                };
            }),
        );
        setIsCouncilActive(false);
    }, []);

    /**
     * Generates responses from all council members in parallel.
     * Updates state progressively as streams arrive.
     *
     * @param messages - The conversation history.
     * @param members - The list of council members (models) to query.
     * @param onUpdate - Callback function triggered whenever responses are updated.
     * @returns A promise that resolves to the final array of CouncilResponses.
     */
    const generateCouncilResponses = async (
        messages: Message[],
        members: CouncilMember[],
        onUpdate: (responses: CouncilResponse[]) => void
    ) => {
        setIsCouncilActive(true);
        const newResponses: CouncilResponse[] = members.map(m => ({
            instanceId: m.instanceId || `${m.modelId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            modelId: m.modelId,
            modelName: m.modelId.split('/').pop() || m.modelId, // Simple name extraction
            status: 'loading',
            content: ''
        }));
        setCouncilResponses(newResponses);
        onUpdate(newResponses);

        try {
            // Parallel Fetch
            await Promise.all(members.map(async (member, index) => {
                try {
                    const controller = new AbortController();
                    const controllerKey = `${member.modelId}-${index}`;
                    abortControllersRef.current.set(controllerKey, controller);

                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                        body: JSON.stringify({
                            messages,
                            model: member.modelId,
                            persona: member.persona,
                            isCouncilMember: true  // Request plain text stream
                        })
                    });

                    if (!response.ok || !response.body) throw new Error('Failed');

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    // Update status to streaming
                    newResponses[index].status = 'streaming';
                    setCouncilResponses([...newResponses]);
                    onUpdate([...newResponses]);

                    // Plain text stream - just append directly
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        newResponses[index].content += chunk;

                        // Estimate tokens progressively
                        const completionTokens = estimateTokens(newResponses[index].content);
                        // Estimate prompt tokens (rough estimate of conversation history)
                        const promptText = messages.map(m => getMessageContent(m)).join('\n');
                        const promptTokens = estimateTokens(promptText);

                        newResponses[index].usage = {
                            prompt_tokens: promptTokens,
                            completion_tokens: completionTokens,
                            total_tokens: promptTokens + completionTokens
                        };

                        setCouncilResponses([...newResponses]);
                        onUpdate([...newResponses]);
                    }

                    newResponses[index].status = 'completed';
                    clearAbortController(controllerKey);
                    setCouncilResponses([...newResponses]);
                    onUpdate([...newResponses]);

                } catch (err) {
                    const controllerKey = `${member.modelId}-${index}`;
                    clearAbortController(controllerKey);
                    const isAbort = err instanceof Error && err.name === 'AbortError';

                    console.error(`Error with model ${member.modelId}:`, err);
                    newResponses[index].status = 'error';
                    newResponses[index].content = isAbort ? 'Cancelled by user.' : 'Failed to generate response.';
                    setCouncilResponses([...newResponses]);
                    onUpdate([...newResponses]);
                }
            }));
        } finally {
            setIsCouncilActive(false);
            abortControllersRef.current.clear();
        }

        return newResponses;
    };

    return {
        isCouncilActive,
        generateCouncilResponses,
        cancelCouncilResponses,
    };
}
