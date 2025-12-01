'use client';

import * as React from "react"
import { Bot, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CouncilResponse } from "@/types/council"
import { calculateCost } from "@/lib/pricing"
import { useEffect, useState } from 'react';

interface CouncilAccordionProps {
    responses: CouncilResponse[]
    onRetry?: (modelId: string) => void
}

export function CouncilAccordion({ responses, onRetry }: CouncilAccordionProps) {
    // Auto-expand items that are streaming or just completed
    const [value, setValue] = useState<string[]>([]);
    const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);

    useEffect(() => {
        // Check if all responses are done (completed or error)
        const allDone = responses.length > 0 && responses.every(r => r.status === 'completed' || r.status === 'error');

        if (allDone) {
            if (!hasAutoCollapsed) {
                // Collapse all
                setValue([]);
                setHasAutoCollapsed(true);
            }
            return;
        }

        // If not all done, reset auto-collapsed flag if we start a new run (e.g. status goes back to loading/streaming)
        // This handles re-runs or new generations
        if (responses.some(r => r.status === 'loading' || r.status === 'streaming')) {
            if (hasAutoCollapsed) setHasAutoCollapsed(false);
        }

        // When responses update, check if we should expand any new ones
        // Strategy: Expand all that are not 'loading' (i.e., have started)
        // We also want to keep open ones that are already open unless explicitly closed?
        // For "Live View", expanding active ones is good.
        const activeIds = responses
            .filter(r => r.status === 'streaming' || r.status === 'completed' || r.status === 'error')
            .map(r => r.modelId);

        // Use setTimeout to avoid synchronous state update warning if this effect runs during render
        const t = setTimeout(() => {
            // We merge with existing values to avoid collapsing things the user might be looking at,
            // but for the "Live View" behavior, we might just want to follow the active ones.
            // Let's stick to the logic from the simpler component which was just setting them.
            // But maybe we only set it if it's different to avoid jitter?
            setValue(prev => {
                const next = Array.from(new Set([...prev, ...activeIds]));
                if (next.length !== prev.length) return next;
                return prev;
            });
        }, 0);
        return () => clearTimeout(t);
    }, [responses, hasAutoCollapsed]);

    // Calculate total cost
    const totalCost = responses.reduce((acc, r) => {
        return acc + calculateCost(r.modelId, r.promptTokens || 0, r.completionTokens || 0);
    }, 0);

    return (
        <div className="w-full border rounded-md my-4 bg-card">
            <div className="px-4 py-2 border-b bg-muted text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3" />
                    Council Deliberation
                </div>
                {totalCost > 0 && (
                    <span className="text-[10px] opacity-70">
                        Est. Cost: ${totalCost.toFixed(5)}
                    </span>
                )}
            </div>
            <Accordion type="multiple" value={value} onValueChange={setValue} className="w-full">
                {responses.map((response) => (
                    <AccordionItem key={response.modelId} value={response.modelId} className="border-b last:border-0">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-accent text-sm group">
                            <div className="flex items-center justify-between w-full pr-2">
                                <span className="font-medium font-serif flex items-center gap-2">
                                    {response.modelName}
                                </span>
                                <div className="flex items-center gap-2">
                                    {response.status === 'completed' && (
                                        <span className="text-[10px] font-mono text-muted-foreground/50">
                                            ${calculateCost(response.modelId, response.promptTokens || 0, response.completionTokens || 0).toFixed(4)}
                                        </span>
                                    )}
                                    <StatusBadge status={response.status} />
                                    {response.status === 'error' && onRetry && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-1 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRetry(response.modelId);
                                            }}
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-background">
                            <ScrollArea className="h-full max-h-[300px] w-full pr-4">
                                <div className="font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                    {response.content || <span className="italic opacity-50">Waiting for output...</span>}
                                </div>
                            </ScrollArea>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

function StatusBadge({ status }: { status: CouncilResponse['status'] }) {
    switch (status) {
        case 'loading':
            return (
                <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-amber-500/50 text-amber-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking
                </Badge>
            )
        case 'streaming':
            return (
                <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-blue-500/50 text-blue-600 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Speaking
                </Badge>
            )
        case 'completed':
            return (
                <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-green-500/50 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                </Badge>
            )
        case 'error':
            return (
                <Badge variant="destructive" className="font-mono text-[10px] h-5 gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Error
                </Badge>
            )
        default:
            return (
                <Badge variant="secondary" className="font-mono text-[10px] h-5">
                    Idle
                </Badge>
            )
    }
}
