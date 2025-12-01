'use client';

import { UIMessage } from '@ai-sdk/react';
import { calculateCost } from '@/lib/pricing';
import { Coins, MessageSquare, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ConversationStatsProps {
    messages: UIMessage[];
}

export function ConversationStats({ messages }: ConversationStatsProps) {
    // Calculate stats
    const stats = messages.reduce((acc, msg) => {
        let cost = 0;
        let tokens = 0;

        // 1. Judge / Assistant Message
        if (msg.role === 'assistant') {
            // Try to use stored cost/tokens if available (from DB)
            // Note: UIMessage from ai-sdk might not have our custom DB fields directly unless we extended the type or passed them.
            // But we can check if they exist on the object.
            const dbMsg = msg as any;

            if (dbMsg.cost !== undefined) {
                cost += dbMsg.cost;
            } else if (dbMsg.prompt_tokens && dbMsg.completion_tokens && dbMsg.model) {
                cost += calculateCost(dbMsg.model, dbMsg.prompt_tokens, dbMsg.completion_tokens);
            }

            if (dbMsg.prompt_tokens) tokens += dbMsg.prompt_tokens;
            if (dbMsg.completion_tokens) tokens += dbMsg.completion_tokens;

            // 2. Council Data (from annotations)
            // Annotations in UIMessage are usually an array of JSON objects or strings?
            // AI SDK `annotations` is `any[] | undefined`.
            // Our API saves `annotations` as a JSON string in DB, but `useChat` might parse it?
            // Actually, `useChat` usually returns annotations as they are sent.
            // Let's inspect how we send them. We send `councilData` in `data` field for user messages?
            // No, we save `annotations` column in DB.
            // When fetching history, we need to ensure `annotations` are passed to `initialMessages`.

            // If we are in "Live" mode, `data` might be present on the message.
            const anyMsg = msg as any;
            if (anyMsg.annotations && Array.isArray(anyMsg.annotations)) {
                anyMsg.annotations.forEach((annotation: any) => {
                    // Check if it's our council data
                    // It might be nested or direct depending on how we load it.
                    // Assuming it's the array of CouncilResponse objects
                    if (Array.isArray(annotation)) {
                        annotation.forEach((c: any) => {
                            if (c.modelId && (c.promptTokens || c.completionTokens)) {
                                const cCost = calculateCost(c.modelId, c.promptTokens || 0, c.completionTokens || 0);
                                cost += cCost;
                                tokens += (c.promptTokens || 0) + (c.completionTokens || 0);
                            }
                        });
                    }
                });
            }
        }

        return {
            count: acc.count + 1,
            tokens: acc.tokens + tokens,
            cost: acc.cost + cost
        };
    }, { count: 0, tokens: 0, cost: 0 });

    if (stats.count === 0) return null;

    return (
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-full border border-border/40">
            <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 opacity-70" />
                <span>{stats.count} msgs</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 opacity-70" />
                <span>{(stats.tokens / 1000).toFixed(1)}k toks</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                <Coins className="w-3 h-3 opacity-70" />
                <span>${stats.cost.toFixed(4)}</span>
            </div>
        </div>
    );
}
