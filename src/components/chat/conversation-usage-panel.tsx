'use client';

import { useMemo, type ReactNode } from 'react';
import { Coins, MessageSquare, Zap } from 'lucide-react';
import { CouncilResponse } from '@/types/council';
import {
  formatTokens,
  formatTimestamp,
  normalizeAnnotations,
  extractCouncilResponses,
  extractUsage,
  getTokenValue,
  parseCost,
} from '@/lib/usage-utils';
import type { ChatMessage } from '@/types/chat';

interface UsageSummary {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  messageCount: number;
}

interface ConversationUsagePanelProps {
  summary: UsageSummary;
  messages: ChatMessage[];
}

interface ProcessedMessage {
  id: string;
  createdAt?: string;
  totalTokens: number;
  cost: number;
  councilResponses?: CouncilResponse[];
}

export function ConversationUsagePanel({ summary, messages }: ConversationUsagePanelProps) {
  const breakdown = useMemo<ProcessedMessage[]>(() => {
    return messages
      .map((msg) => {
        const prompt = getTokenValue(msg, 'prompt_tokens', 'promptTokens');
        const completion = getTokenValue(msg, 'completion_tokens', 'completionTokens');
        const annotations = normalizeAnnotations(msg.annotations);

        return {
          id: msg.id,
          role: msg.role,
          createdAt: msg.created_at || msg.createdAt,
          totalTokens: prompt + completion,
          cost: parseCost(msg.cost),
          councilResponses: extractCouncilResponses(annotations),
        };
      })
      .filter((msg) =>
        msg.role === 'assistant' &&
        (msg.totalTokens > 0 || msg.cost > 0 || (msg.councilResponses?.length ?? 0) > 0)
      );
  }, [messages]);

  if (!breakdown.length || (summary.totalTokens === 0 && summary.cost === 0)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-background/80 px-4 py-3 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-3 mb-3">
        <StatChip
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Total Tokens"
          value={formatTokens(summary.totalTokens)}
          detail={`${formatTokens(summary.promptTokens)} in / ${formatTokens(summary.completionTokens)} out`}
        />
        <StatChip
          icon={<Coins className="h-3.5 w-3.5" />}
          label="Total Cost"
          value={`$${summary.cost.toFixed(5)}`}
          detail="per OpenRouter pricing"
        />
        <StatChip
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Assistant Messages"
          value={summary.messageCount.toString()}
          detail="includes judge responses"
        />
      </div>

      <div className="space-y-2">
        {breakdown.map((msg, index) => (
          <div key={msg.id} className="rounded border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-muted-foreground">
                <span>Message {index + 1}</span>
                {msg.createdAt && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatTimestamp(msg.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {msg.totalTokens > 0 && (
                  <span className="text-muted-foreground">{formatTokens(msg.totalTokens)} tok</span>
                )}
                {msg.cost > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ${msg.cost.toFixed(5)}
                  </span>
                )}
              </div>
            </div>

            {msg.councilResponses && msg.councilResponses.length > 0 && (
              <div className="mt-2 border-l-2 border-border/40 pl-3 space-y-1 text-[11px] font-mono text-muted-foreground">
                {msg.councilResponses.map((response) => {
                  const usage = extractUsage(response);
                  const status = response.status === 'error' ? '✗' : '✓';
                  return (
                    <div key={response.instanceId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">{status}</span>
                        <span>{response.modelName}</span>
                      </div>
                      {usage > 0 && (
                        <span>{formatTokens(usage)} tok</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded border border-border/60 bg-muted/10 p-3 text-xs font-mono">
      <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] tracking-[0.1em]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
      {detail && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{detail}</div>}
    </div>
  );
}

