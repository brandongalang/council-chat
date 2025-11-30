'use client';

import { UIMessage as Message } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, ChevronRight } from 'lucide-react';
import { CouncilAccordion } from '@/components/council/council-accordion';
import { CouncilResponse } from '@/types/council';
import { calculateCost } from '@/lib/pricing';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Extract council responses from annotations if they exist
  // We assume the first annotation might be our Council Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const councilResponses = ((message as any).annotations as any[])?.find(
    a => Array.isArray(a) && a.some(item => 'modelId' in item && 'status' in item)
  ) as CouncilResponse[] | undefined;

  // Parse Structured Judge Output
  let analysisContent = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mainContent = (message as any).content;
  let hasStructuredOutput = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!isUser && (message as any).content.includes('## Analysis')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = (message as any).content.split('## Final Response');
    const analysisParts = parts[0].split('## Analysis');
    if (analysisParts.length > 1) {
      analysisContent = analysisParts[1].trim();
      hasStructuredOutput = true;
      // If we have a final response part, use it. Otherwise (streaming analysis), main content is empty.
      mainContent = parts.length > 1 ? parts[1].trim() : '';
    }
  }

  return (
    <div className={cn(
      "group flex gap-4 p-6 border-b border-border/50 transition-colors hover:bg-accent/5",
      isUser ? "bg-background" : "bg-secondary/10"
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
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
            {isUser ? 'User' : 'System / Agent'}
          </span>
          <span className="font-mono text-xs text-muted-foreground/50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(message as any).createdAt ? new Date((message as any).createdAt).toLocaleTimeString() : ''}
          </span>
        </div>

        {/* Render Council Deliberation if available */}
        {councilResponses && councilResponses.length > 0 && (
          <CouncilAccordion responses={councilResponses} />
        )}

        {/* Render Collapsible Analysis if available */}
        {hasStructuredOutput && (
          <Collapsible
            open={isAnalysisOpen}
            onOpenChange={setIsAnalysisOpen}
            className="border border-border/50 rounded-md bg-background/50 overflow-hidden mb-4"
          >
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 text-xs font-mono uppercase hover:bg-accent/50 transition-colors text-muted-foreground">
              <ChevronRight className={cn("h-4 w-4 transition-transform", isAnalysisOpen && "rotate-90")} />
              <span>Judge's Analysis</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 border-t border-border/50 bg-muted/20">
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm font-sans leading-relaxed mt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysisContent}
                </ReactMarkdown>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm font-sans leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {mainContent}
          </ReactMarkdown>
        </div>

        {/* Analytics Footer */}
        {!isUser && (
          <div className="mt-4 pt-2 border-t border-border/30 flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50">
            {/* Judge Stats */}
            <div className="flex items-center gap-1">
              <span>JUDGE:</span>
              <span>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {((message as any).prompt_tokens || 0) + ((message as any).completion_tokens || 0)} tokens
              </span>
            </div>

            {/* Council Stats */}
            {councilResponses && councilResponses.length > 0 && (
              <div className="flex items-center gap-1">
                <span>COUNCIL:</span>
                <span>
                  {councilResponses.reduce((acc, curr) => acc + (curr.promptTokens || 0) + (curr.completionTokens || 0), 0)} tokens
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
