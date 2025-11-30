import { Accordion } from '@/components/ui/accordion';
import { CouncilResponse } from '@/types/council';
import { CouncilResponseItem } from './council-response-item';
import { useEffect, useState } from 'react';

interface CouncilAccordionProps {
    responses: CouncilResponse[];
}

export function CouncilAccordion({ responses }: CouncilAccordionProps) {
    // Auto-expand items that are streaming or just completed
    const [value, setValue] = useState<string[]>([]);

    useEffect(() => {
        // When responses update, check if we should expand any new ones
        // Strategy: Expand all that are not 'loading' (i.e., have started)
        const activeIds = responses
            .filter(r => r.status === 'streaming' || r.status === 'completed' || r.status === 'error')
            .map(r => r.modelId);

        // We only want to auto-expand, not auto-collapse if user manually changed it.
        // But for simplicity in this "Live View", keeping them all open is usually good.
        // Let's default to all open for now.
        // Use setTimeout to avoid synchronous state update warning
        const t = setTimeout(() => setValue(activeIds), 0);
        return () => clearTimeout(t);
    }, [responses]);

    return (
        <div className="w-full max-w-3xl mx-auto space-y-2">
            <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-mono uppercase text-muted-foreground">Council Deliberation</span>
                {responses.some(r => r.status === 'streaming' || r.status === 'loading') && (
                    <span className="loading loading-spinner loading-xs text-muted-foreground"></span>
                )}
            </div>

            <Accordion type="multiple" value={value} onValueChange={setValue} className="space-y-2">
                {responses.map((response) => (
                    <CouncilResponseItem key={response.modelId} response={response} />
                ))}
            </Accordion>
        </div>
    );
}
