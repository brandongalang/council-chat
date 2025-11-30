'use client';

import { UIMessage as Message } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { CouncilAccordion } from './council-accordion';
import { CouncilResponse } from '@/types/council';

/**
 * Props for the ChatMessage component.
 */
interface ChatMessageProps {
  /** The message object to display. */
  message: Message;
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

  // Extract council responses from annotations if they exist
  // We assume the first annotation might be our Council Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const councilResponses = ((message as any).annotations as any[])?.find(
    a => Array.isArray(a) && a.some(item => 'modelId' in item && 'status' in item)
  ) as CouncilResponse[] | undefined;

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

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm font-sans leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(message as any).content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
