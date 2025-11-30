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
            content: ''
        }));
        setCouncilResponses(newResponses);
        onUpdate(newResponses);

        try {
            // Parallel Fetch
            await Promise.all(members.map(async (member, index) => {
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages,
                            model: member.modelId,
                            persona: member.persona
                        })
                    });

                    if (!response.ok || !response.body) throw new Error('Failed');

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
                        newResponses[index].content += chunk;
                        setCouncilResponses([...newResponses]);
                        onUpdate([...newResponses]);
                    }

                    newResponses[index].status = 'completed';
                    setCouncilResponses([...newResponses]);
                    onUpdate([...newResponses]);

                } catch (err) {
                    console.error(`Error with model ${member.modelId}:`, err);
                    newResponses[index].status = 'error';
                    newResponses[index].content = 'Failed to generate response.';
                    setCouncilResponses([...newResponses]);
                    onUpdate([...newResponses]);
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
