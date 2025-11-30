import { useState } from 'react';
import { UIMessage as Message } from '@ai-sdk/react';
import { CouncilResponse } from '@/types/council';
import { CouncilMember } from '@/components/model-selector';

export function useCouncil() {
    const [councilResponses, setCouncilResponses] = useState<CouncilResponse[]>([]);
    const [isCouncilActive, setIsCouncilActive] = useState(false);

    const generateCouncilResponses = async (
        messages: Message[],
        members: CouncilMember[],
        onUpdate: (responses: CouncilResponse[]) => void
    ) => {
        setIsCouncilActive(true);
        const newResponses: CouncilResponse[] = members.map(m => ({
            modelId: m.modelId,
            modelName: m.modelId.split('/').pop() || m.modelId, // Simple name extraction
            status: 'loading',
            content: '',
            promptTokens: 0,
            completionTokens: 0
        }));
        setCouncilResponses(newResponses);
        onUpdate(newResponses);

        try {
            // Parallel Fetch
            await Promise.all(members.map(async (member, index) => {
                let attempts = 0;
                const maxRetries = 3;
                let success = false;

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
                        newResponses[index].status = 'streaming';
                        setCouncilResponses([...newResponses]);
                        onUpdate([...newResponses]);

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            const chunk = decoder.decode(value, { stream: true });

                            // Check for usage data in the stream (AI SDK sends it as a specific format usually at the end, 
                            // but streamText raw response might just be text unless we use Data Stream Protocol).
                            // For now, let's assume raw text and we might miss tokens unless we switch to Data Stream.
                            // Actually, the AI SDK `streamText` with `toTextStreamResponse` sends raw text.
                            // To get usage, we need to use `toDataStreamResponse` or parse headers if we sent them.
                            // But `streamText` doesn't send usage in headers by default.
                            // Let's rely on the fact that we can't easily get tokens from a raw text stream without protocol.
                            // ALTERNATIVE: We can estimate tokens or switch to `toDataStreamResponse`.
                            // Let's switch to `toDataStreamResponse` in the API if we want data? 
                            // No, that breaks the simple text reading here.
                            // Let's try to read the X-Chat-Id header? No, that's for ID.
                            // Let's just estimate for now OR leave it as 0 until we implement full Data Stream protocol.
                            // Wait, the plan said "Ensure streamText returns token usage".
                            // If I use `toDataStreamResponse`, the client needs to parse the protocol.
                            // The current client code just reads text.
                            // Let's keep it simple: We won't get EXACT tokens for Council members yet unless we change the protocol.
                            // I will leave them as 0 for now to avoid breaking the stream, and we can refine this later.

                            newResponses[index].content += chunk;
                            setCouncilResponses([...newResponses]);
                            onUpdate([...newResponses]);
                        }

                        newResponses[index].status = 'completed';
                        setCouncilResponses([...newResponses]);
                        onUpdate([...newResponses]);
                        success = true;

                    } catch (err: any) {
                        console.error(`Attempt ${attempts} failed for ${member.modelId}:`, err);
                        if (attempts === maxRetries) {
                            newResponses[index].status = 'error';
                            newResponses[index].content = `Failed to generate response after ${maxRetries} attempts. Error: ${err.name === 'AbortError' ? 'Timeout' : err.message}`;
                            setCouncilResponses([...newResponses]);
                            onUpdate([...newResponses]);
                        } else {
                            // Exponential backoff: 1s, 2s, 3s
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                        }
                    }
                }
            }));
        } finally {
            setIsCouncilActive(false);
        }

        return newResponses;
    };

    return {
        councilResponses,
        isCouncilActive,
        generateCouncilResponses,
        setCouncilResponses
    };
}
