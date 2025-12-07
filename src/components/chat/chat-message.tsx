'use client';

import { UIMessage as Message } from '@ai-sdk/react';
import { cn, parseJudgeResponse, sanitizeCustomTags } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Streamdown } from 'streamdown';
import { User, Bot, ChevronDown, Brain, Gavel, Coins, Loader2, CheckCircle2 } from 'lucide-react';
import { CouncilAccordion } from './council-accordion';
import { CouncilResponse } from '@/types/council';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { getMessageContent as extractMessageContent } from '@/lib/message-utils';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

/**
 * Props for the ChatMessage component.
 */
interface ChatMessageProps {
  /** The message object to display. */
  message: Message;
}

/**
 * Status badge for synthesis progress
 */
function SynthesisStatusBadge({
  isPending,
  isStreaming,
  hasAnswer
}: {
  isPending: boolean;
  isStreaming: boolean;
  hasAnswer: boolean;
}) {
  if (isPending) {
    return (
      <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-[hsl(var(--status-loading)/0.5)] text-[hsl(var(--status-loading))]">
        <Loader2 className="w-3 h-3 animate-spin" />
        Awaiting
      </Badge>
    );
  }
  if (isStreaming && !hasAnswer) {
    return (
      <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-[hsl(var(--status-streaming)/0.5)] text-[hsl(var(--status-streaming))] animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        Analyzing
      </Badge>
    );
  }
  if (isStreaming && hasAnswer) {
    return (
      <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-[hsl(var(--status-streaming)/0.5)] text-[hsl(var(--status-streaming))] animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        Writing
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1 border-[hsl(var(--status-success)/0.5)] text-[hsl(var(--status-success))]">
      <CheckCircle2 className="w-3 h-3" />
      Done
    </Badge>
  );
}

/**
 * Displays a single chat message.
 * Handles user and assistant messages, markdown rendering, and displaying council deliberations if present.
 *
 * @param props - The properties for the ChatMessage.
 * @returns The rendered ChatMessage.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const typedMessage = message as ChatMessageType;
  // Extract council responses from annotations if they exist
  // We assume the first annotation might be our Council Data
  const annotations = typedMessage.annotations;
  const councilResponses = annotations?.find(
    a => Array.isArray(a) && a.some(item => 'modelId' in item && 'status' in item)
  ) as CouncilResponse[] | undefined;

  // Extract judge model from annotations if present
  const judgeModelInfo = annotations?.find(
    a => typeof a === 'object' && !Array.isArray(a) && 'judgeModel' in a
  ) as { judgeModel: string; isPending?: boolean; isSynthesizing?: boolean } | undefined;

  // Check if this is a pending council message (still streaming)
  const isPending = judgeModelInfo?.isPending === true;

  // Check if synthesizer is starting (shows reasoning placeholder immediately)
  const isSynthesizing = judgeModelInfo?.isSynthesizing === true;

  // Check if this is a council response (has council data)
  const isCouncilResponse = councilResponses && councilResponses.length > 0;

  // Parse the message content for XML tags (only for assistant messages)
  const rawContent = extractMessageContent(message);
  const parsedContent = !isUser ? parseJudgeResponse(rawContent) : null;

  // Detect if this is a judge response streaming without proper annotations
  // This happens during the transition from pending message to streaming message
  const isOrphanedJudgeStream = !isUser && parsedContent?.hasTags && !isCouncilResponse;

  // Determine what content to display
  // During streaming (answer not complete), show partial answer if available
  // Once complete, show only the answer section
  let displayContent = rawContent;
  let isStreaming = false;

  if (parsedContent?.hasTags) {
    if (parsedContent.answer) {
      displayContent = parsedContent.answer;
      isStreaming = !parsedContent.answerComplete;
    } else if (parsedContent.reasoning) {
      // Only reasoning so far, answer hasn't started
      displayContent = '';
      isStreaming = true;
    }
  }

  // For orphaned judge streams (no council data yet), show a synthesis indicator
  // instead of raw XML content
  if (isOrphanedJudgeStream) {
    return (
      <div className={cn(
        "group flex gap-4 p-6 border-b border-border/50 transition-colors hover:bg-accent/5",
        "bg-secondary/10"
      )}>
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 rounded-none border border-border">
            <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 space-y-4 overflow-hidden max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
              Council Synthesis
            </span>
          </div>

          {/* Show synthesis in progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 py-2">
              <Gavel className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                Synthesis
              </span>
              <SynthesisStatusBadge isPending={false} isStreaming={true} hasAnswer={!!parsedContent?.answer} />
            </div>

            {/* Show reasoning collapsible if available */}
            {parsedContent?.reasoning && (
              <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors py-2 px-3 bg-primary/5 border border-primary/20 w-full">
                  <Brain className="h-3 w-3" />
                  <span className="uppercase tracking-wider">Reasoning</span>
                  <SynthesisStatusBadge
                    isPending={false}
                    isStreaming={!parsedContent?.answer}
                    hasAnswer={!!parsedContent?.answer}
                  />
                  <ChevronDown className={cn(
                    "h-3 w-3 ml-auto transition-transform",
                    isReasoningOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-muted/30 border border-border/50 text-xs">
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                      <div className="prose prose-neutral dark:prose-invert max-w-none text-xs font-sans leading-relaxed opacity-80 overflow-x-auto">
                        <Streamdown>
                          {sanitizeCustomTags(parsedContent.reasoning || '')}
                        </Streamdown>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Show answer section if available */}
            {parsedContent?.answer && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 py-2">
                  <Gavel className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[10px] font-bold uppercase text-primary">
                    Synthesis
                  </span>
                  <SynthesisStatusBadge isPending={false} isStreaming={!parsedContent.answerComplete} hasAnswer={true} />
                </div>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-sm font-sans leading-relaxed">
                    <Streamdown>
                      {sanitizeCustomTags(parsedContent.answer || '')}
                    </Streamdown>
                    {!parsedContent.answerComplete && (
                      <span className="inline-block ml-1 w-2 h-4 bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show waiting indicator if no answer yet */}
            {!parsedContent?.answer && (
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground py-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
                <span>Synthesizing response...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex gap-4 p-6 border-b border-border/50 transition-colors hover:bg-accent/5",
      isUser ? "flex-row-reverse bg-muted/20" : "bg-secondary/10"
    )}>
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8 rounded-none border border-border">
          {isUser ? (
            <AvatarFallback className="rounded-none bg-primary text-primary-foreground"><User className="h-4 w-4" /></AvatarFallback>
          ) : (
            <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
          )}
        </Avatar>
      </div>
      <div className={cn(
        "flex-1 space-y-4 overflow-hidden max-w-3xl",
        isUser && "flex flex-col items-end ml-auto"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isUser && "flex-row-reverse"
        )}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isUser ? 'User' : isCouncilResponse ? 'Council Synthesis' : 'System / Agent'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {typedMessage.createdAt ? new Date(typedMessage.createdAt).toLocaleTimeString() : ''}
          </span>
        </div>

        {/* Render Council Deliberation if available */}
        {councilResponses && councilResponses.length > 0 && (
          <div className="space-y-3">
            <CouncilAccordion responses={councilResponses} />
          </div>
        )}

        {/* Show waiting for synthesis message when pending */}
        {isPending && (
          <div className="space-y-3">
            <Separator className="my-2" />
            <div className="flex items-center gap-2 py-2">
              <Gavel className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Synthesis
              </span>
              <SynthesisStatusBadge isPending={true} isStreaming={false} hasAnswer={false} />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground py-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
              <span>Waiting for council responses to complete...</span>
            </div>
          </div>
        )}

        {/* Render Judge Reasoning in Collapsible if available (only when not pending) */}
        {/* Show immediately when isSynthesizing is true, even without content yet */}
        {!isPending && (isSynthesizing || (parsedContent?.hasTags && parsedContent.reasoning)) && (
          <div className="space-y-3">
            <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors py-2 px-3 bg-primary/5 border border-primary/20 w-full">
                <Brain className="h-3 w-3" />
                <span className="uppercase tracking-wider">Reasoning</span>
                <SynthesisStatusBadge
                  isPending={false}
                  isStreaming={isSynthesizing && !parsedContent?.answer}
                  hasAnswer={!!parsedContent?.answer}
                />
                {judgeModelInfo?.judgeModel && (
                  <span className="ml-auto mr-2 text-muted-foreground/60">({judgeModelInfo.judgeModel.split('/').pop()})</span>
                )}
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  !judgeModelInfo?.judgeModel && "ml-auto",
                  isReasoningOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {parsedContent?.reasoning ? (
                  <div className="mt-2 p-3 bg-muted/30 border border-border/50 text-xs overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                      <div className="prose prose-neutral dark:prose-invert max-w-none text-xs font-sans leading-relaxed opacity-80 overflow-x-auto">
                        <Streamdown>
                          {sanitizeCustomTags(parsedContent.reasoning)}
                        </Streamdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="font-mono text-xs">Waiting for synthesis to begin...</span>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Separator between council components and final answer */}
        {!isPending && isCouncilResponse && (parsedContent?.answer || displayContent) && (
          <div className="pt-2">
            <Separator className="my-2" />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                  Synthesis
                </span>
                <SynthesisStatusBadge isPending={false} isStreaming={isStreaming} hasAnswer={!!displayContent} />
                {judgeModelInfo?.judgeModel && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    via {judgeModelInfo.judgeModel.split('/').pop()}
                  </span>
                )}
              </div>

              {/* Token Usage Display for Judge */}
              {(typedMessage.promptTokens || typedMessage.completionTokens) && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded border border-border/30">
                  <Coins className="h-3 w-3" />
                  <span>
                    {(typedMessage.promptTokens || 0) + (typedMessage.completionTokens || 0)} tokens
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show streaming indicator when waiting for answer */}
        {!isPending && isStreaming && !displayContent && (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground py-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
            <span>Synthesizing response...</span>
          </div>
        )}

        {/* Main content */}
        {!isPending && displayContent && (
          <div className="max-h-[500px] overflow-y-auto w-full pr-2">
            <div className={cn(
              "prose prose-neutral dark:prose-invert max-w-none text-sm font-sans leading-relaxed",
              isUser && "text-right"
            )}>
              <Streamdown>
                {sanitizeCustomTags(displayContent)}
              </Streamdown>
              {isStreaming && (
                <span className="inline-block ml-1 w-2 h-4 bg-primary animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
