'use client';

import { UIMessage } from '@ai-sdk/react';
import { calculateCost } from '@/lib/pricing';
import { ChevronDown, Coins } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MessageCostBreakdownProps {
    message: UIMessage;
}

export function MessageCostBreakdown({ message }: MessageCostBreakdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (message.role !== 'assistant') return null;

    const dbMsg = message as any;
    let judgeCost = 0;
    let judgeTokensIn = 0;
    let judgeTokensOut = 0;
    const councilCosts: Array<{ name: string; cost: number; in: number; out: number }> = [];

    // 1. Judge Stats
    if (dbMsg.cost !== undefined) {
        judgeCost = dbMsg.cost;
    } else if (dbMsg.prompt_tokens && dbMsg.completion_tokens && dbMsg.model) {
        judgeCost = calculateCost(dbMsg.model, dbMsg.prompt_tokens, dbMsg.completion_tokens);
    }
    judgeTokensIn = dbMsg.prompt_tokens || 0;
    judgeTokensOut = dbMsg.completion_tokens || 0;

    // 2. Council Stats
    const anyMsg = message as any;
    if (anyMsg.annotations && Array.isArray(anyMsg.annotations)) {
        anyMsg.annotations.forEach((annotation: any) => {
            if (Array.isArray(annotation)) {
                annotation.forEach((c: any) => {
                    if (c.modelId && (c.promptTokens || c.completionTokens)) {
                        const cCost = calculateCost(c.modelId, c.promptTokens || 0, c.completionTokens || 0);
                        councilCosts.push({
                            name: c.modelId.split('/').pop() || c.modelId,
                            cost: cCost,
                            in: c.promptTokens || 0,
                            out: c.completionTokens || 0
                        });
                    }
                });
            }
        });
    }

    const totalCost = judgeCost + councilCosts.reduce((acc, c) => acc + c.cost, 0);

    if (totalCost === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-2">
            <CollapsibleTrigger className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors group w-full justify-end">
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md group-hover:bg-accent">
                    <Coins className="w-3 h-3" />
                    <span>${totalCost.toFixed(4)}</span>
                    <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-[10px] text-muted-foreground font-mono mt-2 bg-muted rounded-md p-2 space-y-1 animate-in slide-in-from-top-2">
                {councilCosts.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <span className="opacity-70">├─ {c.name}</span>
                        <div className="flex gap-3">
                            <span className="opacity-50">{c.in} in / {c.out} out</span>
                            <span>${c.cost.toFixed(4)}</span>
                        </div>
                    </div>
                ))}
                <div className="flex justify-between items-center font-medium text-foreground/70 pt-1 border-t border-border/20 mt-1">
                    <span>└─ Judge ({dbMsg.model?.split('/').pop() || 'Unknown'})</span>
                    <div className="flex gap-3">
                        <span className="opacity-50">{judgeTokensIn} in / {judgeTokensOut} out</span>
                        <span>${judgeCost.toFixed(4)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center font-bold text-foreground pt-2 border-t border-border/40 mt-1">
                    <span>Total</span>
                    <span>${totalCost.toFixed(4)}</span>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
