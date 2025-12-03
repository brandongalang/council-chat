'use client';

import { ChatMessage as ChatMessageItem } from './chat-message';
import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { CouncilResponse } from '@/types/council';

interface ChatListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  streamingCouncilData?: {
    councilResponses: CouncilResponse[];
    judgeModel: string;
  } | null;
}

export function ChatList({ messages, isLoading, streamingCouncilData }: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Handle scroll events to detect if user is at the bottom
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 50px of the bottom
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    // Only auto-scroll if the user was already at the bottom
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm p-12">
        <div className="text-center space-y-2 opacity-50">
          <p>NO TRANSMISSIONS RECORDED.</p>
          <p className="text-xs">Initiate protocol to begin session.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scroll-smooth"
    >
      <div className="flex flex-col min-h-full pb-4">
        {messages.map((message, i) => {
          // Check if we need to inject streaming council data
          // Only inject if the message DOES NOT have annotations yet
          const hasAnnotations = Boolean(message.annotations && message.annotations.length > 0);
          const isLast = i === messages.length - 1;

          const shouldInjectData = isLast &&
            streamingCouncilData &&
            message.role === 'assistant' &&
            !hasAnnotations;

          const displayMessage: ChatMessageType = shouldInjectData
            ? {
                ...message,
                annotations: [
                  streamingCouncilData.councilResponses,
                  { judgeModel: streamingCouncilData.judgeModel }
                ]
              }
            : message;

          return <ChatMessageItem key={message.id} message={displayMessage} />;
        })}
        {isLoading && (
          <div className="p-6 flex gap-2 items-center text-xs font-mono text-muted-foreground animate-pulse">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
            <span>PROCESSING STREAM...</span>
          </div>
        )}
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </div>
  );
}
